import mongoose from "mongoose";

const episodeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    audioFileUrl: {
      // Changed from audioUrl to audioFileUrl
      type: String,
      required: true,
    },
    duration: {
      type: String, // Can store as '1hr 30min' or as minutes.
      required: true,
    },
    guest: {
      type: String,
    },
    coverPhoto: {
      type: String,
      default: null, // or remove required: true to make it optional
    },
    podcast: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Podcast",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Episode = mongoose.model("Episode", episodeSchema);

export default Episode;
