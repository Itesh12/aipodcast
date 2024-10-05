import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addEpisodeToPlaylist,
  removeEpisodeFromPlaylist,
} from "../controllers/playlistController.js";

const router = express.Router();

// Create a new playlist
router.post("/create", protect, createPlaylist);

// Update a playlist
router.put("/update-playlist/:playlistId", protect, updatePlaylist);

// Delete a playlist
router.delete("/delete-playlist/:playlistId", protect, deletePlaylist);

router.post("/add-episode", protect, addEpisodeToPlaylist); // Add episode to playlist
router.delete("/remove-episode", protect, removeEpisodeFromPlaylist); // Remove episode from playlist

export default router;
