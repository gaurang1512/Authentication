import express from "express";
import {
  registerUser,
  verifyEmail,
  loginUser,
  verifyOtp,
  myProfile,
  refreshToken,
  logOutUser,
  adminController,
} from "../controller/user.js";
import { isAuth } from "../middleware/isAuth.js";
import { checkPermission } from "../middleware/checkPermission.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify-email/:token", verifyEmail);
router.post("/login", loginUser);
router.post("/verify", verifyOtp);
router.get("/me", isAuth, myProfile);
router.post("/refresh", refreshToken);
router.post("/logout", isAuth, logOutUser);
router.get("/admin", isAuth, checkPermission(PERMISSIONS.ACCESS_ADMIN_PANEL), adminController);
export default router;
