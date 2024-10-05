import express from "express";
import {
  addBookmark,
  removeBookmark,
  getBookmarkedPodcasts,
} from "../controllers/bookmarksController.js";
import { protect } from "../middleware/authMiddleware.js"; // Assuming you have middleware for authentication

const router = express.Router();

router.post("/create-bookmark", protect, addBookmark); // Add a bookmark
router.delete("/delete-bookmark", protect, removeBookmark); // Remove a bookmark
router.get("/get-all-bookmark", protect, getBookmarkedPodcasts); // Remove a bookmark

export default router;
