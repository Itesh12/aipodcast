import User from "../models/userModel.js";

// Add a podcast to bookmarks
export const addBookmark = async (req, res) => {
  const { podcastId } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.bookmarks.includes(podcastId)) {
      user.bookmarks.push(podcastId);
      await user.save();
      return res.status(200).json({ message: "Podcast bookmarked" });
    }

    res.status(400).json({ message: "Podcast already bookmarked" });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    res.status(500).json({ message: "Error adding bookmark", error });
  }
};

// Remove a podcast from bookmarks
export const removeBookmark = async (req, res) => {
  const { podcastId } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.bookmarks = user.bookmarks.filter(
      (bookmark) => bookmark.toString() !== podcastId
    );
    await user.save();

    res.status(200).json({ message: "Podcast removed from bookmarks" });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    res.status(500).json({ message: "Error removing bookmark", error });
  }
};

// Get all bookmarked podcasts
export const getBookmarkedPodcasts = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).populate("bookmarks");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ bookmarks: user.bookmarks });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).json({ message: "Error fetching bookmarks", error });
  }
};
