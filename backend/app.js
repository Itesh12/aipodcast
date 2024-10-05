import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/authRoutes.js";
import podcastRoutes from "./routes/podcastRoutes.js";
import episodeRoutes from "./routes/episodeRoutes.js";
import playlistRoutes from "./routes/playlistRoutes.js";
import bookmarkRoutes from "./routes/bookmarkRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());

connectDB();

//Auth Routes
app.use("/api/auth", userRoutes);

//Podcast Routes
app.use("/api/podcasts", podcastRoutes);

//Episode Routes
app.use("/api/episodes", episodeRoutes);

//Playlist Routes
app.use("/api/playlists", playlistRoutes);

//Bookmarks Routes
app.use("/api/bookmarks", bookmarkRoutes);

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  res.status(404).json({ message: "API route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
