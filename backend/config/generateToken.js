// file_path: backend/config/generateToken.js
import jwt from "jsonwebtoken";
import { redisClient } from "../index.js";

export const generateToken = async (id, res, role) => {
  const accessToken = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "1m",
  });

  const refreshToken = jwt.sign({ id, role }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });

  const refreshTokenKey = `refresh_token:${id}`;

  await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decode = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const storedToken = await redisClient.get(`refresh_token:${decode.id}`);

    if (storedToken === refreshToken) {
      return decode;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const generateAccessToken = (id, res, role) => {
  const accessToken = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "1m",
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1 * 60 * 1000,
  });

  return accessToken;
};

export const revokeRefreshToken = async (userId) => {
  await redisClient.del(`refresh_token:${userId}`);
};
