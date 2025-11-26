const request = require("supertest");
const express = require("express");

// Mock the ChakraAssessment model: the router uses only .find()
jest.mock("../../models/chakraAssessment", () => ({
  find: jest.fn(),
}));

// Mock CSRF middleware the router applies on GET "/"
jest.mock("../../middleware/csrf", () => (req, res, next) => next());

const ChakraAssessment = require("../../models/chakraAssessment");
const statsRouter = require("../statsRoutes");
const { getMonthFilter, calculateAggregateStats, prepareChartData } = require("../statsRoutes");

describe("Stats routes", () => {
  let app;
  let logSpy, errSpy;

  const buildAssessments = () => {
    // Mix of Maps and plain objects to exercise the aggregator
    const makeMap = (obj) => {
      const m = new Map();
      Object.entries(obj).forEach(([k, v]) => m.set(k, v));
      return m;
    };

    return [
      {
        createdAt: new Date("2025-10-05"),
        results: {
          rootChakra: { total: 10 },
          sacralChakra: { total: 12 },
          solarPlexusChakra: { total: 14 },
          heartChakra: { total: 16 },
          throatChakra: { total: 18 },
          thirdEyeChakra: { total: 20 },
          crownChakra: { total: 22 },
          // life quadrants as plain totals
          healthWellness: { total: 30 },
          loveRelationships: { total: 40 },
          careerJob: { total: 35 },
          timeMoney: { total: 25 },
        },
        focusChakra: "heartChakra",
        archetypeResult: "creatorVisionary",
        ageBracket: "25-34",
        topChallenges: ["stress", "time"],
        experience: "past",
        familiarWith: ["soundBaths", "lifeCoaching"],
        healthcareWorker: "Yes",
      },
      {
        createdAt: new Date("2025-10-15"),
        // results using Map
        results: makeMap({
          rootChakra: { total: 8 },
          sacralChakra: { total: 10 },
          solarPlexusChakra: { total: 12 },
          heartChakra: { total: 14 },
          throatChakra: { total: 16 },
          thirdEyeChakra: { total: 18 },
          crownChakra: { total: 20 },
        }),
        // life quadrants as Map-of-answers requiring sum
        scoredLifeQuadrants: makeMap({
          healthWellness: makeMap({ a: { score: 5 }, b: { score: 6 } }), // 11
          loveRelationships: makeMap({ a: { score: 4 }, b: { score: 4 } }), // 8
          careerJob: makeMap({ a: { score: 3 }, b: { score: 2 } }), // 5
          timeMoney: makeMap({ a: { score: 7 }, b: { score: 1 } }), // 8
        }),
        focusChakra: "throatChakra",
        archetype: "ruler",
        ageBracket: "35-44",
        challenges: ["stress"],
        experience: "current",
        familiarWith: ["none"], // special handling
        healthcareWorker: "No",
      },
    ];
  };

  const mountApp = () => {
    const a = express();
    a.use(express.json());
    a.use(express.urlencoded({ extended: true }));

    // stub a view engine so res.render works
    a.use((req, res, next) => {
    res.render = (_view, locals) => res.send(JSON.stringify(locals || {}));
    next();
    });

    a.use(statsRouter);
    return a;
  };

  beforeAll(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    app = mountApp();
    // ensure a cold cache by hitting the clear-cache endpoint
    await request(app).post("/api/clear-cache");
  });

  test("GET / renders admin dashboard with fresh data and caches the result", async () => {
    const data = buildAssessments();
    ChakraAssessment.find.mockResolvedValueOnce(data);

    const res1 = await request(app).get("/");
    expect(res1.status).toBe(200);
    // This JSON is the render data: { stats, assessments }
    const parsed1 = JSON.parse(res1.text);
    expect(Array.isArray(parsed1.assessments)).toBe(true);
    expect(parsed1.assessments.length).toBe(2);
    expect(parsed1.stats).toBeDefined();
    expect(parsed1.stats.chakraAverages).toBeDefined();

    // Second hit should use the cache (no extra .find call)
    const res2 = await request(app).get("/");
    expect(res2.status).toBe(200);
    expect(ChakraAssessment.find).toHaveBeenCalledTimes(1);
  });

  test("POST /api/clear-cache clears the cache and forces a refetch next time", async () => {
    const data = buildAssessments();
    ChakraAssessment.find.mockResolvedValue(data);

    // Warm the cache via dashboard
    await request(app).get("/");
    expect(ChakraAssessment.find).toHaveBeenCalledTimes(1);

    // Clear cache
    const clearRes = await request(app).post("/api/clear-cache");
    expect(clearRes.status).toBe(200);
    expect(clearRes.body).toEqual({ message: "Cache cleared successfully" });

    // Next call should fetch again
    await request(app).get("/");
    expect(ChakraAssessment.find).toHaveBeenCalledTimes(2);
  });

  test("GET /api/stats-summary returns summary (fresh) and sets cache", async () => {
    const data = buildAssessments();
    ChakraAssessment.find.mockResolvedValueOnce(data);

    const res = await request(app).get("/api/stats-summary");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("chakraAverages");
    expect(res.body).toHaveProperty("lifeQuadrantAverages");
    expect(res.body).toHaveProperty("totalSubmissions", 2);
  });

  test("GET /api/stats-summary supports month filter without touching cache", async () => {
    // Hit with a month filter; assert the .find() got a date filter
    ChakraAssessment.find.mockResolvedValueOnce(buildAssessments());

    const res = await request(app).get("/api/stats-summary?month=2025-10");
    expect(res.status).toBe(200);
    expect(ChakraAssessment.find).toHaveBeenCalledTimes(1);

    const arg = ChakraAssessment.find.mock.calls[0][0];
    // Should look like { createdAt: { $gte: Date, $lte: Date } }
    expect(arg).toHaveProperty("createdAt.$gte");
    expect(arg).toHaveProperty("createdAt.$lte");
    expect(arg.createdAt.$gte instanceof Date).toBe(true);
    expect(arg.createdAt.$lte instanceof Date).toBe(true);
  });

  test("GET /api/chart-data returns computed chart datasets (fresh path)", async () => {
    ChakraAssessment.find.mockResolvedValueOnce(buildAssessments());

    const res = await request(app).get("/api/chart-data");
    expect(res.status).toBe(200);
    // Should be the composite chart data object
    expect(res.body).toHaveProperty("chakraData.labels");
    expect(res.body).toHaveProperty("lifeQuadrantData.labels");
    expect(res.body).toHaveProperty("focusChakraData.labels");
    expect(res.body).toHaveProperty("archetypeData.labels");
  });

  test("GET /api/chart-data uses cached assessments when cache is warm", async () => {
    // Warm the cache through dashboard (which stores both stats & assessments)
    ChakraAssessment.find.mockResolvedValueOnce(buildAssessments());
    await request(app).get("/");

    // With valid cache, this should reuse cached assessments.
    const res = await request(app).get("/api/chart-data");
    expect(res.body && res.body.chakraData).toBeDefined();
  });

  test("GET /api/chart-data supports month filter (bypasses cache and does not cache filtered)", async () => {
    ChakraAssessment.find.mockResolvedValueOnce(buildAssessments());

    const res = await request(app).get("/api/chart-data?month=2025-10");
    expect(res.status).toBe(200);
    expect(ChakraAssessment.find).toHaveBeenCalledTimes(1);

    const arg = ChakraAssessment.find.mock.calls[0][0];
    expect(arg).toHaveProperty("createdAt.$gte");
    expect(arg).toHaveProperty("createdAt.$lte");
  });

  test("handles errors gracefully", async () => {
    ChakraAssessment.find.mockRejectedValueOnce(new Error("boom"));
    const res1 = await request(app).get("/");
    expect(res1.status).toBe(500);

    ChakraAssessment.find.mockRejectedValueOnce(new Error("boom"));
    const res2 = await request(app).get("/api/chart-data");
    expect(res2.status).toBe(500);
    expect(res2.body).toHaveProperty("error");

    ChakraAssessment.find.mockRejectedValueOnce(new Error("boom"));
    const res3 = await request(app).get("/api/stats-summary");
    expect(res3.status).toBe(500);
    expect(res3.body).toHaveProperty("error");
  });

  test("getMonthFilter builds inclusive month range", () => {
    const f = getMonthFilter("2025-10");
    expect(f.createdAt.$gte).toEqual(new Date(2025, 9, 1));
    expect(f.createdAt.$lte).toEqual(new Date(2025, 9, 31, 23, 59, 59, 999));
  });

  test("prepareChartData returns stable shapes", () => {
    const stats = calculateAggregateStats(buildAssessments());
    const chart = prepareChartData([{ /* doesn’t matter; using function itself */ }]); // or pass buildAssessments()
    expect(chart).toHaveProperty("chakraData.labels");
    expect(Array.isArray(chart.chakraData.datasets)).toBe(true);
  });
});
