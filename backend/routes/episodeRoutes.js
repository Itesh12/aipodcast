import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../config/multerConfig.js";
import multer from "multer";

import {
  createEpisode,
  updateEpisode,
  deleteEpisode,
} from "../controllers/episodeController.js";

const router = express.Router();

router.put(
  "/:episodeId",
  protect,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "Multer Error", error: err });
      } else if (err) {
        return res
          .status(500)
          .json({ message: "Unknown Upload Error", error: err });
      }
      next();
    });
  },
  updateEpisode
);

router.delete("/:episodeId", protect, deleteEpisode);

router.post(
  "/:podcastId/create-episode",
  protect,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "Multer Error", error: err });
      } else if (err) {
        return res
          .status(500)
          .json({ message: "Unknown Upload Error", error: err });
      }
      next();
    });
  },
  createEpisode
);

export default router;
