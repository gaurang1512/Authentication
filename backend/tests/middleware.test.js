import request from "supertest";
import express from "express";
import { describe, it, expect, jest, beforeAll, afterAll } from "@jest/globals";
import cookieParser from "cookie-parser";
import { isAuth } from "../middleware/isAuth.js";
import { checkPermission } from "../middleware/checkPermission.js";
import { PERMISSIONS } from "../config/permissions.js";

// Mock dependencies
const mockUser = {
  _id: "123",
  role: "admin",
};

const mockReq = {
  cookies: { accessToken: "valid_token" },
  user: mockUser,
};

// Mock Redis
jest.mock("../index.js", () => ({
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn(),
    connect: jest.fn(),
  },
}));

// Mock JWT
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn().mockReturnValue({ id: "123" }),
}));

// Mock Mongoose Models
jest.mock("../models/User.js", () => ({
  User: {
    findById: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue(mockUser),
  },
}));

jest.mock("../models/Role.js", () => ({
  Role: {
    findOne: jest.fn().mockResolvedValue({
      name: "admin",
      permissions: [PERMISSIONS.ACCESS_ADMIN_PANEL],
    }),
  },
}));

describe("Middleware Tests", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(cookieParser());
    app.use(express.json());
    
    // Setup routes for testing middleware
    app.get("/test/auth", isAuth, (req, res) => res.status(200).json({ user: req.user }));
    app.get("/test/admin", isAuth, checkPermission(PERMISSIONS.ACCESS_ADMIN_PANEL), (req, res) => res.status(200).json({ message: "Admin Access" }));
  });

  describe("isAuth Middleware", () => {
    it("should allow access with valid token", async () => {
       // Note: Since we mocked modules, we rely on the mocks behaving correctly.
       // In a real integration test we'd use real tokens.
       // Here we are testing the logic flow assuming jwt.verify passes.
       
       const res = await request(app)
         .get("/test/auth")
         .set("Cookie", ["accessToken=valid_token"]);
       
       expect(res.status).toBe(200);
       expect(res.body.user).toBeDefined();
    });

    it("should return 401 if no token", async () => {
        const res = await request(app).get("/test/auth");
        expect(res.status).toBe(401);
    });
  });

  describe("checkPermission Middleware", () => {
    it("should allow admin to access protected route", async () => {
        const res = await request(app)
          .get("/test/admin")
          .set("Cookie", ["accessToken=valid_token"]);
        
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Admin Access");
    });
  });
});
