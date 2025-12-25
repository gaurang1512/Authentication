import jwt from "jsonwebtoken";
import { redisClient } from "../index.js";
import { User } from "../models/User.js";

export const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized: No token provided. Please login.",
      });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const cacheUser = await redisClient.get(`user:${decodedData.id}`);

    if (cacheUser) {
      req.user = JSON.parse(cacheUser);
      return next();
    }

    const user = await User.findById(decodedData.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: User not found.",
      });
    }

    await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token has expired." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized: Invalid token." });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
