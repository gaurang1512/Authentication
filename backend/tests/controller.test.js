import request from "supertest";
import express from "express";
import { describe, it, expect, jest, beforeAll, afterAll } from "@jest/globals";
import { myProfile } from "../controller/user.js";

// Mock middleware
const mockUser = {
  _id: "123",
  name: "Test User",
  email: "test@example.com",
  role: "admin",
};

const mockRequest = (user) => ({
  user,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("User Controller - myProfile", () => {
  it("should return user object wrapped in { user }", async () => {
    const req = mockRequest(mockUser);
    const res = mockResponse();

    await myProfile(req, res);

    expect(res.json).toHaveBeenCalledWith({ user: mockUser });
  });
});
