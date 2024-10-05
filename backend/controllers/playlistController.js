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

// Add an episode to a playlist and update the user model
export const addEpisodeToPlaylist = async (req, res) => {
  const { playlistId, episodeId } = req.body;
  const userId = req.user._id;

  try {
    // Find the playlist by ID and ensure the playlist belongs to the user
    const playlist = await Playlist.findOne({ _id: playlistId, user: userId });

    if (!playlist) {
      return res
        .status(404)
        .json({ message: "Playlist not found or does not belong to the user" });
    }

    // Check if the episode is already in the playlist
    if (!playlist.episodes.includes(episodeId)) {
      playlist.episodes.push(episodeId); // Add episode to playlist
      await playlist.save(); // Save the updated playlist data

      return res
        .status(200)
        .json({ message: "Episode added to playlist", playlist });
    }

    res.status(400).json({ message: "Episode already in playlist" });
  } catch (error) {
    console.error("Error adding episode to playlist:", error);
    res
      .status(500)
      .json({ message: "Error adding episode to playlist", error });
  }
};

// Remove an episode from a playlist and update the user model
export const removeEpisodeFromPlaylist = async (req, res) => {
  const { playlistId, episodeId } = req.body;
  const userId = req.user._id;

  try {
    // Find the playlist by ID and ensure it belongs to the user
    const playlist = await Playlist.findOne({ _id: playlistId, user: userId });

    if (!playlist) {
      return res
        .status(404)
        .json({ message: "Playlist not found or does not belong to the user" });
    }

    // Filter out the episode from the playlist
    playlist.episodes = playlist.episodes.filter(
      (episode) => episode.toString() !== episodeId
    );

    await playlist.save(); // Save the updated playlist data

    res
      .status(200)
      .json({ message: "Episode removed from playlist", playlist });
  } catch (error) {
    console.error("Error removing episode from playlist:", error);
    res
      .status(500)
      .json({ message: "Error removing episode from playlist", error });
  }
};
