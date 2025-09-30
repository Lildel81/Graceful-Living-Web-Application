const request = require("supertest");
const express = require("express");
const router = require("../../routes/chakraRoutes");
const { getScore, scoreAnswers, determineArchetype, findFocusChakra } = router; // import functions from chakraRoutes

// create an express app using the router
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/assessment", router);

// --- mock notifyAdmins for now to test chakra quiz functions ---
jest.mock("../../services/adminNotifications", () => ({
  notifyAdmins: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../models/chakraAssessment"); // mock mongoose model

const ChakraAssessment = require("../../models/chakraAssessment");

describe("POST /assessment/save", () => {
  test("saves and redirects", async () => {
    // mock save
    ChakraAssessment.prototype.save = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post("/assessment/save")
      .send({
        fullName: "Test User",
        email: "test@example.com",
        contactNumber: "1234567890",
        ageBracket: "20-30",
        healthcareWorker: "Yes",
        healthcareYears: 2,
        jobTitle: "Student",
        experience: "Lots",
        familiarWith: ["Chakras"],
        experienceDetails: "Details",
        goals: "Grow",
        challenges: ["Time"]
      });

    expect(res.status).toBe(302); // redirect
    expect(res.header.location).toMatch(/\/assessment\/results\?id=/);
    expect(ChakraAssessment.prototype.save).toHaveBeenCalled();
  });
});

// function testing
describe("getScore", () => {
  test("returns default score for standard answers", () => {
    expect(getScore("default", 0, "Good")).toBe(2);
    expect(getScore("default", 0, "Excellent")).toBe(3);
  });

  test("uses per-question override if defined", () => {
    expect(getScore("solarPlexus", 0, "Never")).toBe(3); // q1 special case
    expect(getScore("solarPlexus", 0, "Always")).toBe(0);
  });

  test("falls back to 0 for invalid answer", () => {
    expect(getScore("default", 0, "NotAnAnswer")).toBe(0);
  });
});

describe("scoreAnswers", () => {
  test("scores each answer object", () => {
    const answers = { q1: "Good", q2: "Poor" };
    const scored = scoreAnswers(answers, "default");

    expect(scored.q1.score).toBe(2);
    expect(scored.q2.score).toBe(0);
  });
});

describe("determineArchetype", () => {
  test("chooses archetype with highest count", () => {
    const lifeQuadrantScores = {
      healthWellness: {
        q1: { score: 0 }, // low score -> picks first archetype
        q2: { score: 1 }
      },
      loveRelationships: {
        q1: { score: 3 }, // high score -> picks second archetype
        q2: { score: 3 }
      }
    };

    const archetype = determineArchetype(lifeQuadrantScores);
    expect(typeof archetype).toBe("string");
    expect(archetype.length).toBeGreaterThan(0);
  });
});

describe("findFocusChakra", () => {
  test("returns chakra with highest total", () => {
    const results = {
      rootChakra: { total: 5 },
      crownChakra: { total: 10 }
    };
    const { focusChakra } = findFocusChakra(results);
    expect(focusChakra).toBe("crownChakra");
  });
});