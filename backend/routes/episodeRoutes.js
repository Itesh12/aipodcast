import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../config/multerConfig.js"; // Adjust path accordingly
import multer from "multer";

import {
  createEpisode,
  updateEpisode,
  deleteEpisode,
} from "../controllers/episodeController.js";

const router = express.Router();

router.put(
  "/:episodeId",
  protect, // Authentication middleware
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "Multer Error", error: err });
      } else if (err) {
        return res
          .status(500)
          .json({ message: "Unknown Upload Error", error: err });
      }
      next(); // Proceed to updateEpisode controller
    });
  },
  updateEpisode
);

router.delete("/:episodeId", protect, deleteEpisode); // Delete an episode
// Episode create routes
router.post(
  "/:podcastId/create-episode",
  protect, // Authentication middleware
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "Multer Error", error: err });
      } else if (err) {
        return res
          .status(500)
          .json({ message: "Unknown Upload Error", error: err });
      }
      next(); // Proceed to createEpisode controller
    });
  },
  createEpisode
);

export default router;
