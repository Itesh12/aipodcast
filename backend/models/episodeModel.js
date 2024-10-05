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
      type: String,
      required: true,
    },
    duration: {
      type: String, // Storing formatted duration like '1hr 30min'
      required: true,
    },
    guest: {
      type: String,
    },
    coverPhoto: {
      type: String,
      default: null,
    },
    podcast: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Podcast",
      required: true,
    },
    playedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Track users who marked the episode as played
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
