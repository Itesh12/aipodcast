import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Playlist from "../models/playlistModel.js";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    interests: {
      type: [String], // Array of strings for interests
      required: true,
      default: [], // Default to an empty array
    },
    notificationsPreferences: {
      newEpisodes: { type: Boolean, default: true }, // Notify for new episodes
      podcastUpdates: { type: Boolean, default: true }, // Notify for podcast updates
    },
    languagePreferences: {
      type: [String], // Ensure this is an array of strings
      required: false, // Change to false if not required
    },
    preferredCategories: {
      type: [String], // Array of strings for preferred categories
      default: [], // Default to an empty array
    },
    profilePicture: {
      type: String,
      default: "", // Default value for profile picture
    },
    bio: {
      type: String,
      default: "", // Default value for bio
    },
    websiteLinks: {
      type: [String],
      default: [], // Default to an empty array
    },
    favoritePodcasts: {
      type: [String], // Corrected: Declared once
      default: [], // Default to an empty array
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Podcast", // Assuming Podcast is the model for podcasts
      },
    ],
    subscribedPodcasts: {
      type: [String],
      default: [], // Default to an empty array
    },
    createdPodcasts: {
      type: [String],
      default: [], // Default to an empty array
    },
    totalListeningTime: {
      type: String,
      default: "0hr 0min", // Default value for total listening time
    },
    searchHistory: {
      type: [String], // Track user search history
      default: [], // Default to an empty array
    },
    playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Playlist" }], // Reference to Playlist model
    token: {
      type: String,
      default: "", // Token to store after registration
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
