import express from "express";
import upload from "../config/multerConfig.js"; // Adjust path accordingly
import {
  createPodcast,
  getAllPodcasts,
  getPodcastById,
  updatePodcast,
  deletePodcast,
  getRelatedPodcasts,
  getRecommendedPodcasts,
  getTrendingPodcasts,
  commentOnPodcast,
  sharePodcast,
  likePodcast,
} from "../controllers/podcastController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Like the podcasts
router.post("/like-podcast/:id", protect, likePodcast);

// Share the podcasts
router.post("/share-podcast/:id", protect, sharePodcast);

// Comment on podcasts
router.post("/comment-on-podcast/:id", protect, commentOnPodcast);

// Get trending podcasts
router.get("/trending-podcasts", protect, getTrendingPodcasts);

// Route for recommended podcasts (place this before routes that include ID)
router.get("/recommended", protect, getRecommendedPodcasts);

// Route to create a new podcast
router.post("/create", protect, createPodcast);

// Route to get all podcasts with search and filter
router.get("/get-all-podcasts", getAllPodcasts);

// Route to get a podcast by ID
router.get("/:id", getPodcastById);

// Update a podcast
router.put("/:id", protect, upload, updatePodcast);

// Delete a podcast
router.delete("/:id", protect, deletePodcast);

// Get related podcasts based on user ID
router.get("/:id/related", protect, getRelatedPodcasts);

export default router;
