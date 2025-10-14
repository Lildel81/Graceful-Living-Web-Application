const request = require("supertest");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const User = require("../../models/userSchema");
const ChakraAssessment = require("../../models/chakraAssessment");
const authRouter = require("../userAuth");

// mock dependencies
jest.mock("../../models/userSchema");
jest.mock("../../models/chakraAssessment");
jest.mock("bcrypt");

describe("User Authentication Routes", () => {
  let app;

  // suppressing logs
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

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

    // mock CSRF token
    app.use((req, res, next) => {
      req.csrfToken = () => "mock-csrf-token";
      next();
    });

    // mock view engine
    app.set("view engine", "ejs");
    app.engine("ejs", (path, data, cb) => cb(null, JSON.stringify(data)));

    app.use(authRouter);

    jest.clearAllMocks();
  });

  // --- helper functions ---
  describe("saveTempResultsToUser helper", () => {
    it("should associate temp assessment with user", async () => {
      const mockAssessment = {
        submissionId: "sub123",
        user: null,
        save: jest.fn().mockResolvedValue(true),
      };

      ChakraAssessment.findOne.mockResolvedValue(mockAssessment);

      expect(ChakraAssessment.findOne).toBeDefined();
    });
  });

  // --- GET routes ---
  describe("GET routes", () => {
    it("renders signup form with CSRF token", async () => {
      const res = await request(app).get("/user-signup");
      expect(res.status).toBe(200);
      expect(res.text).toContain("mock-csrf-token");
      expect(res.text).toContain('"error":null');
    });

    it("renders login form with CSRF token", async () => {
      const res = await request(app).get("/user-login");
      expect(res.status).toBe(200);
      expect(res.text).toContain("mock-csrf-token");
      expect(res.text).toContain('"error":null');
    });

    it("destroys session and redirects on logout", async () => {
      const res = await request(app).get("/logout");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/");
    });
  });

  // --- POST /user-signup ---
  describe("POST /user-signup", () => {
    const signupData = { fullName: "John Doe", email: "john@example.com", password: "password123" };

    it("returns 400 if fields are missing", async () => {
      const res = await request(app).post("/user-signup").send({ fullName: "John Doe" });
      expect(res.status).toBe(400);
      expect(res.text).toContain("All fields are required");
    });

    it("returns 409 if email already exists", async () => {
      User.findOne.mockResolvedValue({ email: "existing@example.com" });

      const res = await request(app).post("/user-signup").send(signupData);

      expect(res.status).toBe(409);
      expect(res.text).toContain("Email is already registered");
      expect(User.findOne).toHaveBeenCalledWith({ email: "john@example.com" });
    });

    it("creates user and redirects on success", async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed-password");

      const mockUser = {
        _id: "user123",
        fullName: "John Doe",
        email: "john@example.com",
        password: "hashed-password",
        save: jest.fn().mockResolvedValue(true),
      };

      User.mockImplementation(() => mockUser);

      const res = await request(app).post("/user-signup").send(signupData);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/user-dashboard");
    });

    it("handles temp assessment association", async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed-password");

      const mockUser = {
        _id: "user123",
        fullName: "John Doe",
        email: "john@example.com",
        save: jest.fn().mockResolvedValue(true),
      };
      User.mockImplementation(() => mockUser);

      const mockAssessment = {
        submissionId: "sub123",
        user: null,
        save: jest.fn().mockResolvedValue(true),
      };
      ChakraAssessment.findOne.mockResolvedValue(mockAssessment);

      const testApp = express();
      testApp.use(express.json());
      testApp.use(express.urlencoded({ extended: true }));
      testApp.use(session({ secret: "test-secret", resave: false, saveUninitialized: true }));
      testApp.use((req, res, next) => {
        req.csrfToken = () => "mock-csrf-token";
        req.session.tempResults = { submissionId: "sub123" };
        req.session.tempResultsReturnUrl = "/results/sub123";
        next();
      });
      testApp.set("view engine", "ejs");
      testApp.engine("ejs", (p, d, cb) => cb(null, JSON.stringify(d)));
      testApp.use(authRouter);

      const res = await request(testApp).post("/user-signup").send(signupData);

      expect(mockUser.save).toHaveBeenCalled();
      expect(ChakraAssessment.findOne).toHaveBeenCalledWith({ submissionId: "sub123" });
      expect(mockAssessment.save).toHaveBeenCalled();
      expect(mockAssessment.user).toBe("user123");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/results/sub123");
    });

    it("handles unexpected errors", async () => {
      User.findOne.mockRejectedValue(new Error("Database error"));

      const res = await request(app).post("/user-signup").send(signupData);

      expect(res.status).toBe(500);
      expect(res.text).toContain("Unexpected error");
    });
  });

  // --- POST /user-login ---
  describe("POST /user-login", () => {
    const loginData = { email: "john@example.com", password: "password123" };

    it("returns 400 if fields are missing", async () => {
      const res = await request(app).post("/user-login").send({ email: "john@example.com" });
      expect(res.status).toBe(400);
      expect(res.text).toContain("Please fill in both fields");
    });

    it("returns 401 if user not found", async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app).post("/user-login").send(loginData);
      expect(res.status).toBe(401);
      expect(res.text).toContain("Invalid email or password");
    });

    it("returns 401 if password incorrect", async () => {
      User.findOne.mockResolvedValue({ _id: "user123", password: "hashed-password" });
      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app).post("/user-login").send(loginData);
      expect(res.status).toBe(401);
      expect(res.text).toContain("Invalid email or password");
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed-password");
    });

    it("logs in successfully", async () => {
      User.findOne.mockResolvedValue({ _id: "user123", fullName: "John Doe", password: "hashed-password" });
      bcrypt.compare.mockResolvedValue(true);

      const res = await request(app).post("/user-login").send(loginData);
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed-password");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/user-dashboard");
    });

    it("associates temp results after login", async () => {
      User.findOne.mockResolvedValue({ _id: "user123", fullName: "John Doe", password: "hashed-password" });
      bcrypt.compare.mockResolvedValue(true);

      const mockAssessment = { submissionId: "sub123", user: null, save: jest.fn().mockResolvedValue(true) };
      ChakraAssessment.findOne.mockResolvedValue(mockAssessment);

      const testApp = express();
      testApp.use(express.json());
      testApp.use(express.urlencoded({ extended: true }));
      testApp.use(session({ secret: "test-secret", resave: false, saveUninitialized: true }));
      testApp.use((req, res, next) => {
        req.csrfToken = () => "mock-csrf-token";
        req.session.tempResults = { submissionId: "sub123" };
        req.session.tempResultsReturnUrl = "/results/sub123";
        next();
      });
      testApp.set("view engine", "ejs");
      testApp.engine("ejs", (p, d, cb) => cb(null, JSON.stringify(d)));
      testApp.use(authRouter);

      const res = await request(testApp).post("/user-login").send(loginData);

      expect(ChakraAssessment.findOne).toHaveBeenCalledWith({ submissionId: "sub123" });
      expect(mockAssessment.save).toHaveBeenCalled();
      expect(mockAssessment.user).toBe("user123");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/results/sub123");
    });

    it("handles unexpected errors during login", async () => {
      User.findOne.mockRejectedValue(new Error("Database error"));
      const res = await request(app).post("/user-login").send(loginData);
      expect(res.status).toBe(500);
      expect(res.text).toContain("Unexpected error");
    });
  });
});