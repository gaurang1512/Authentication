import TryCatch from "../middleware/TryCatch.js";
import sanitize from "mongo-sanitize";
import registerSchema from "../config/zod.js";
import { loginSchema } from "../config/zod.js";
import { redisClient } from "../index.js";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import { getVerifyEmailHtml } from "../config/html.js";
import { getOtpHtml } from "../config/html.js";
import {
  generateToken,
  verifyRefreshToken,
  generateAccessToken,
  revokeRefreshToken,
} from "../config/generateToken.js";

export const registerUser = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);

  const validation = registerSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    //This will automatically tell in which field error is there
    const zodError = validation.error;

    //Above line give a big error In this we are distructuring that whole error
    let firstErrorMessage = "Validation Failed";
    let allError = [];

    if (zodError?.issues && Array.isArray(zodError.issues)) {
      allError = zodError.issues.map((issue) => ({
        field: issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Validation Error",
        code: issue.code,
      }));

      firstErrorMessage = allError[0]?.message || "Validation Error";
    }
    return res.status(400).json({
      message: firstErrorMessage,
      error: allError,
    });
  }

  const { name, email, password, role } = validation.data;

  //Seting rate limit
  const rateLimitKey = `register-rate-limit:${req.ip}:${email}`;
  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      //429 status code is for too many requests
      message: "Too many requests, try again later",
    });
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  //hashing password
  const hashPassword = await bcrypt.hash(password, 10);

  // (url)http://localhost:5173/(Token)dsbkhasfbefb and we will verify this and this will be stored in radis for 5 min
  const verifyToken = crypto.randomBytes(32).toString("hex");

  const verifyKey = `verify:${verifyToken}`;

  const datatoStore = JSON.stringify({
    name,
    email,
    password: hashPassword,
    role,
  });

  //                                            //expiry time 5 min
  await redisClient.set(verifyKey, datatoStore, { EX: 300 });

  const subject = "verify your email for Account creation";

  //after creating html.js file
  const html = getVerifyEmailHtml({ email, token: verifyToken });

  await sendMail({ email, subject, html });

  //1 email will be send per second setting rate limit to send email
  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  res.json({
    message:
      "If your email is valid, a verification link has been send.it will expire in 5 minutes",
  });
});

//user varification

// Renamed from verifyUser to verifyEmail for clarity
export const verifyEmail = TryCatch(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      message: "verification token is required",
    });
  }

  //verify token is expired or not
  const verifyKey = `verify:${token}`;

  const userDataJson = await redisClient.get(verifyKey);

  if (!userDataJson) {
    return res.status(400).json({
      message: "verification link is expired",
    });
  }

  //extracting user data
  const userData = JSON.parse(userDataJson);

  // SECURITY FIX: Check for existing user BEFORE deleting the token.
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    return res.status(400).json({
      // Don't delete the token, just inform the user.
      // This prevents spamming a user who is already registered.
      message: "User already exists",
    });
  }

  //Creating new user
  const newUser = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role,
  });
  //role will be automatically saved

  // Now that the user is created, delete the verification token
  await redisClient.del(verifyKey);

  //sending message to user
  return res.status(201).json({
    message: "Email verified sucessfully! Your account has been created",
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  });
});

export const loginUser = TryCatch(async (req, res) => {
  const sanitezedBody = sanitize(req.body);

  const validation = loginSchema.safeParse(sanitezedBody);

  if (!validation.success) {
    //This will automatically tell in which field error is there
    const zodError = validation.error;

    //Above line give a big error In this we are distructuring that whole error
    let firstErrorMessage = "Validation Failed";
    let allError = [];

    if (zodError?.issues && Array.isArray(zodError.issues)) {
      allError = zodError.issues.map((issue) => ({
        field: issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Validation Error",
        code: issue.code,
      }));

      firstErrorMessage = allError[0]?.message || "Validation Error";
    }
    return res.status(400).json({
      message: firstErrorMessage,
      error: allError,
    });
  }

  const { email, password } = validation.data;
  //OTP generation
  //setting rate limit
  const rateLimitKey = `login-rate-limit:${req.ip}:${email}`;
  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      //429 status code is for too many requests
      message: "Too many requests, try again later",
    });
  }

  //find user exist or not
  const user = await User.findOne({ email });
  //if email not found
  if (!user) {
    return res.status(400).json({
      message: "Invalid credentials",
    });
  }

  //Comparing user enterd password and existing password in database
  const comparePassword = await bcrypt.compare(password, user.password);
  if (!comparePassword) {
    return res.status(400).json({
      message: "Invalid credentials",
    });
  }

  //Otp generation
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //Storing in redis
  const otpKey = `otp:${email}`;

  await redisClient.set(otpKey, JSON.stringify(otp), {
    EX: 300, //Expire in 5 minutes
  });

  const subject = "Otp for verification";
  //html template for email
  const html = getOtpHtml({ email, otp });

  await sendMail({ email, subject, html });

  await redisClient.set(rateLimitKey, "true", {
    EX: 60, //Expire in 1 minutes
  });

  res.json({
    message:
      "If your is valid , an otp is send. It will be valid for 5 minutes.",
  });
});

//verify user 2 Factor authentication
export const verifyOtp = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      message: "Please provide all details",
    });
  }
  const otpKey = `otp:${email}`;

  const storedOtpString = await redisClient.get(otpKey);

  if (!storedOtpString) {
    return res.status(400).json({
      message: "otp expired",
    });
  }

  const storedOtp = JSON.parse(storedOtpString);

  if (storedOtp !== otp) {
    return res.status(400).json({
      message: "Invalid otp",
    });
  }
  //if all thing are right then delete otp
  await redisClient.del(otpKey);

  let user = await User.findOne({ email });

  //we are storing 2 tokens refresh token and acesess token
  //1 access token 1 min expiry and getting access
  //2 refresh token 7days expiry from user log in
  // this will keep session alive for 7 days
  // if siggned in from multiple browsers when user logged out from one browser like chrome then he will be logged out from all other browsers

  //generating token after verification
  const tokenData = await generateToken(user._id, res);

  res.status(200).json({
    message: `welcome ${user.name}`,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const myProfile = TryCatch(async (req, res) => {
  const user = req.user;
  res.json({ user });
});

//creating new Api to create access token from refresh token

export const refreshToken = TryCatch(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Invalid refresh Token",
    });
  }

  //decoding data
  const decode = await verifyRefreshToken(refreshToken);

  if (!decode) {
    return res.status(400).json({
      message: "Invalid refresh Token",
    });
  }

  //if both check point passes then
  const newAccessToken = generateAccessToken(decode.id, res);
  res.status(200).json({
    message: "Token refreshed",
    accessToken: newAccessToken,
  });
});

//Log out function
export const logOutUser = TryCatch(async (req, res) => {
  const userId = req.user._id;

  await revokeRefreshToken(userId);

  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");

  await redisClient.del(`user:${userId}`);

  res.json({
    message: "Logged out successfully",
  });
});

//Admin Controller functions
export const adminController = TryCatch(async (req, res) => {
  res.json({ message: "Welcome Admin!" });
});
