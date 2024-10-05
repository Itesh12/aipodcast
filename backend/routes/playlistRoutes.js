import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
} from "../controllers/playlistController.js";

const router = express.Router();

// Create a new playlist
router.post("/create", protect, createPlaylist);

// Update a playlist
router.put("/update-playlist/:playlistId", protect, updatePlaylist);

// Delete a playlist
router.delete("/delete-playlist/:playlistId", protect, deletePlaylist);

export default router;
