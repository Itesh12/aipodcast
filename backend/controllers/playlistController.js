import User from "../models/userModel.js";
import Playlist from "../models/playlistModel.js";

// Create a new playlist with episodes
export const createPlaylist = async (req, res) => {
  const { name, episodes } = req.body;
  const userId = req.user.id; // Assuming you're using middleware to get the user ID

  try {
    // Create a new playlist
    const newPlaylist = new Playlist({
      name,
      episodes, // Save the array of episode IDs
      user: userId,
    });

    const playlist = await newPlaylist.save();

    // Add the playlist's _id to the user's playlists array
    await User.findByIdAndUpdate(
      userId,
      { $push: { playlists: playlist._id } }, // Push the playlist ID into the user's playlists array
      { new: true } // Return the updated user document
    );

    res.status(201).json(playlist);
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(400).json({ message: "Error creating playlist", error });
  }
};

// Update an existing playlist
export const updatePlaylist = async (req, res) => {
  const { playlistId } = req.params;
  const { name, episodes } = req.body;

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Update the playlist details
    playlist.name = name || playlist.name;

    // Update the episodes (could also use $addToSet to prevent duplicates)
    playlist.episodes = episodes || playlist.episodes;

    const updatedPlaylist = await playlist.save();
    res.json(updatedPlaylist);
  } catch (error) {
    res.status(400).json({ message: "Error updating playlist", error });
  }
};

// Delete a playlist
export const deletePlaylist = async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user._id; // Assuming middleware is being used to attach the user's ID

  try {
    // Find the playlist to check if it exists and if the user is the owner
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Check if the playlist belongs to the user
    if (playlist.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this playlist" });
    }

    // Remove the playlist from the Playlist collection
    await Playlist.findByIdAndDelete(playlistId);

    // Find the user and remove the playlist ID from the user's playlists array
    await User.findByIdAndUpdate(
      userId,
      { $pull: { playlists: playlistId } }, // Use $pull to remove the playlist ID from the user's playlists array
      { new: true } // Return the updated user document (optional)
    );

    res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    res.status(500).json({ message: "Error deleting playlist", error });
  }
};
