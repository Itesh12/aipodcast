import express from "express";
import upload from "../config/multerConfig.js"; // Adjust path accordingly
import {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  changePassword,
  initiatePasswordReset,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);
router.get("/profile", protect, getUserProfile);
router.post("/reset-password", initiatePasswordReset); // Route for initiating a password reset
router.put("/change-password", protect, changePassword); // Route for changing the password
router.put("/profile", protect, upload, updateUserProfile);

router.delete("/profile", protect, deleteUser);

export default router;
