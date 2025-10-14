const request = require("supertest");
const express = require("express");
const session = require("express-session");
const ChakraAssessment = require("../../models/chakraAssessment");
const { notifyAdmins } = require("../../services/adminNotifications");
const chakraRouter = require("../chakraRoutes");

// mock dependencies
jest.mock("../../models/chakraAssessment");
jest.mock("../../services/adminNotifications");
jest.mock("uuid", () => ({ v4: () => "test-uuid-123" }));

// mock resultsContent
jest.mock("../../public/js/results", () => ({
  chakras: {
    rootChakra: { name: "Root", description: "Test root data" },
  },
  archetypes: {
    workerBee: { name: "Worker Bee", description: "Test archetype" },
  },
}));

describe("Chakra Assessment Routes", () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(
      session({
        secret: "test-secret",
        resave: false,
        saveUninitialized: true,
      })
    );

    // mock view engine
    app.set("view engine", "ejs");
    app.engine("ejs", (path, data, cb) => cb(null, JSON.stringify(data)));

    app.use("/assessment", chakraRouter);

    jest.clearAllMocks();
  });

  // --- helper Functions ---
  describe("Helper Functions", () => {
    describe("getScore", () => {
      it("handles default and special cases", () => {
        expect(chakraRouter.getScore(null, 0, "Poor")).toBe(0);
        expect(chakraRouter.getScore("solarPlexus", 0, "Never")).toBe(3);
        expect(chakraRouter.getScore("crownChakra", 1, "Excellent")).toBe(2);
        expect(
          chakraRouter.getScore("loveRelationships", 2, "Yes, I always do one of these or both")
        ).toBe(3);
      });
    });

    it("scoreAnswers produces scores", () => {
      const answers = { q1: "Poor", q2: "Good" };
      const scored = chakraRouter.scoreAnswers(answers);
      expect(scored.q1.score).toBeDefined();
      expect(scored.q2.score).toBeDefined();
    });

    it("determineArchetype returns a string", () => {
    const mockScores = {
        healthWellness: { q1: { score: 0 }, q2: { score: 1 } },
        loveRelationships: { q1: { score: 1 }, q2: { score: 0 } },
        careerJob: { q1: { score: 2 }, q2: { score: 1 } },
        timeMoney: { q1: { score: 0 }, q2: { score: 2 } },
    };

    const archetype = chakraRouter.determineArchetype(mockScores);
    expect(typeof archetype).toBe("string");
    expect(archetype.length).toBeGreaterThan(0);
    });

    it("findFocusChakra returns lowest total", () => {
      const results = { a: { total: 5 }, b: { total: 3 } };
      const { focusChakra } = chakraRouter.findFocusChakra(results);
      expect(focusChakra).toBe("b");
    });
  });

  // --- POST /assessment/save ---
  describe("POST /assessment/save", () => {
    const validData = { fullName: "John", email: "john@example.com" };

    it("saves assessment and redirects", async () => {
      ChakraAssessment.mockImplementation(function () { this.save = jest.fn().mockResolvedValue(true); return this; });
      notifyAdmins.mockResolvedValue(true);

      const res = await request(app).post("/assessment/save").send(validData);
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/assessment/results?id=test-uuid-123");
    });

    it("handles database save errors", async () => {
      ChakraAssessment.mockImplementation(function () { this.save = jest.fn().mockRejectedValue(new Error("DB fail")); return this; });
      const res = await request(app).post("/assessment/save").send(validData);
      expect(res.status).toBe(500);
      expect(res.text).toContain("Error saving assessment response");
    });

    it("handles notifyAdmins failure gracefully", async () => {
      ChakraAssessment.mockImplementation(function () { this.save = jest.fn().mockResolvedValue(true); return this; });
      notifyAdmins.mockRejectedValue(new Error("Email down"));

      const res = await request(app).post("/assessment/save").send(validData);
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/assessment/results?id=test-uuid-123");
    });
  });

  // --- GET /assessment/results ---
  describe("GET /assessment/results", () => {
    it("returns 404 if not found", async () => {
      ChakraAssessment.findOne.mockResolvedValue(null);
      const res = await request(app).get("/assessment/results?id=missing");
      expect(res.status).toBe(404);
      expect(res.text).toContain("Assessment not found");
    });

    it("renders results for valid assessment", async () => {
      ChakraAssessment.findOne.mockResolvedValue({ submissionId: "id", focusChakra: "rootChakra", archetype: "workerBee", user: null });
      const res = await request(app).get("/assessment/results?id=id");
      expect(res.status).toBe(200);
      const parsed = JSON.parse(res.text);
      expect(parsed.chakraData.name).toBe("Root");
      expect(parsed.archetypeData.name).toBe("Worker Bee");
    });

    it("denies access if assessment belongs to different user", async () => {
      ChakraAssessment.findOne.mockResolvedValue({ submissionId: "id", user: { toString: () => "userB" } });
      const testApp = express();
      testApp.use(express.json());
      testApp.use(express.urlencoded({ extended: true }));
      testApp.use(session({ secret: "test", resave: false, saveUninitialized: true }));
      testApp.use((req, res, next) => { req.session.user = { _id: "userA" }; next(); });
      testApp.set("view engine", "ejs");
      testApp.engine("ejs", (p, d, cb) => cb(null, JSON.stringify(d)));
      testApp.use("/assessment", chakraRouter);

      const res = await request(testApp).get("/assessment/results?id=id");
      expect(res.status).toBe(403);
      expect(res.text).toContain("not authorized");
    });
  });
});
