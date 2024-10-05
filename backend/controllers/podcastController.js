import Podcast from "../models/podcastModel.js";
import User from "../models/userModel.js";

// Create a new podcast
export const createPodcast = async (req, res) => {
  const { title, description, status, metadata, coverPhoto } = req.body;
  const host = req.user.id; // Ensure the host is the authenticated user

  try {
    const newPodcast = new Podcast({
      title,
      description,
      status,
      metadata,
      coverPhoto,
      host,
    });
    await newPodcast.save();
    res.status(201).json(newPodcast);
  } catch (error) {
    res.status(400).json({ message: "Error creating podcast", error });
  }
};

// Get all podcasts with pagination and filters
export const getAllPodcasts = async (req, res) => {
  const { page = 1, limit = 10, query, genre, language, status } = req.query;

  try {
    const filters = {};

    if (genre) {
      filters["metadata.genre"] = { $in: genre.split(",") };
    }
    if (language) {
      filters["metadata.language"] = { $in: language.split(",") };
    }
    if (status) {
      filters.status = status;
    }

    const searchFilter = query
      ? {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const podcasts = await Podcast.find({ ...filters, ...searchFilter })
      .populate("host", "userName") // Populate host details
      .limit(limit * 1) // Limit results
      .skip((page - 1) * limit); // Pagination

    const total = await Podcast.countDocuments({ ...filters, ...searchFilter });

    res.json({
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      podcasts,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving podcasts", error });
  }
};

// Get podcast by ID
export const getPodcastById = async (req, res) => {
  const { id } = req.params;

  try {
    const podcast = await Podcast.findById(id).populate("host", "userName");
    if (!podcast) {
      return res.status(404).json({ message: "Podcast not found" });
    }
    res.json(podcast);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving podcast", error });
  }
};

// Update podcast
export const updatePodcast = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, metadata } = req.body;

  try {
    // Create the update data object, including optional fields
    const updateData = {
      title,
      description,
      status,
      metadata,
      updatedAt: Date.now(),
    };

    // Find the podcast by ID and update it
    const podcast = await Podcast.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true, // Ensures validation is run on the update
    });

    // Check if the podcast exists
    if (!podcast) {
      return res.status(404).json({ message: "Podcast not found" });
    }

    // If a cover photo is uploaded, update it
    if (req.files && req.files.coverPhoto) {
      podcast.coverPhoto = `${req.protocol}://${req.get(
        "host"
      )}/uploads/images/${req.files.coverPhoto[0].filename}`; // Assume `coverPhoto` is the key for the cover photo file
    }

    // Save the updated episode
    const updatedEpisode = await podcast.save();

    // Respond with the updated podcast
    res.json(updatedEpisode);
  } catch (error) {
    console.error("Error updating podcast:", error); // Log the error for debugging
    res.status(400).json({ message: "Error updating podcast", error });
  }
};

// Delete podcast
export const deletePodcast = async (req, res) => {
  const { id } = req.params;

  try {
    const podcast = await Podcast.findByIdAndDelete(id);
    if (!podcast) {
      return res.status(404).json({ message: "Podcast not found" });
    }
    res.json({ message: "Podcast deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting podcast", error });
  }
};

// Get related podcasts based on user preferences (interests, favoritePodcasts, searchHistory)
export const getRelatedPodcasts = async (req, res) => {
  const userId = req.user.id; // Assuming authentication middleware sets req.user
  try {
    // Get user information (interests, favorite podcasts, search history)
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log the fetched user data
    console.log("User fetched:", user);

    // Combine interests, favoritePodcasts, and searchHistory to form search criteria
    const searchCriteria = [
      ...user.interests,
      ...user.favoritePodcasts,
      ...user.searchHistory,
    ];

    // Check if searchCriteria is empty
    if (!searchCriteria.length) {
      return res.status(400).json({ message: "No search criteria found." });
    }

    // Log the search criteria
    console.log("Searching for podcasts with criteria:", searchCriteria);

    // Find podcasts that match user's preferences
    const relatedPodcasts = await Podcast.find({
      $or: [
        { "metadata.genre": { $in: searchCriteria } },
        { _id: { $in: user.favoritePodcasts } },
        { "metadata.language": { $in: searchCriteria } },
      ],
      status: "active", // Only show active podcasts
    })
      .limit(10) // Limit results to 10 podcasts
      .populate("host", "userName") // Populate host information
      .exec();

    res.json(relatedPodcasts);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({
      message: "Error fetching related podcasts",
      error: error.message,
    });
  }
};

// Get recommended podcasts based on user preferences
export const getRecommendedPodcasts = async (req, res) => {
  console.log("Incoming Request: ", req.method, req.originalUrl); // Log the incoming request
  const userId = req.user.id; // Assuming authentication middleware sets req.user

  try {
    // Get user information (interests, favorite podcasts, search history)
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log user information
    console.log("User:", user);

    // Create a search criteria based on user preferences
    const searchCriteria = [
      ...user.interests,
      ...user.favoritePodcasts,
      ...user.searchHistory,
    ];

    // Log search criteria
    console.log("Search Criteria:", searchCriteria);

    // Validate favorite podcasts
    const validFavoritePodcasts = user.favoritePodcasts.filter((id) => {
      const isValid = mongoose.Types.ObjectId.isValid(id);
      if (!isValid) {
        console.log("Invalid Favorite Podcast ID: ", id);
      }
      return isValid;
    });

    console.log("User's Valid Favorite Podcasts:", validFavoritePodcasts);

    // Create the query for recommended podcasts
    const query = {
      status: "active", // Only show active podcasts
    };

    // If there are search criteria, add it to the query
    if (searchCriteria.length > 0) {
      query.$or = [
        { "metadata.genre": { $in: searchCriteria } },
        { _id: { $in: validFavoritePodcasts } },
        { "metadata.language": { $in: searchCriteria } },
      ];
    } else {
      // If no preferences, fetch random active podcasts
      const allActivePodcasts = await Podcast.find({ status: "active" })
        .limit(10) // Limit results to 10 podcasts
        .populate("host", "userName")
        .exec();

      return res.json(allActivePodcasts);
    }

    // Fetch recommended podcasts based on the constructed query
    const recommendedPodcasts = await Podcast.find(query)
      .limit(10) // Limit results to 10 podcasts
      .populate("host", "userName")
      .exec();

    // Log the recommended podcasts
    console.log("Recommended Podcasts:", recommendedPodcasts);

    res.json(recommendedPodcasts);
  } catch (error) {
    console.error("Error fetching recommended podcasts:", error); // Log the error
    res
      .status(500)
      .json({ message: "Error fetching recommended podcasts", error });
  }
};

// Get trending podcasts based on user preferences
export const getTrendingPodcasts = async (req, res) => {
  try {
    const { timeFrame } = req.query; // Get timeFrame from query parameters

    // Set a date range based on the time frame
    let startDate;
    const now = new Date();

    switch (timeFrame) {
      case "daily":
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case "weekly":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "monthly":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(0); // Default to the beginning of time
    }

    // Find active podcasts updated within the specified timeframe
    const trendingPodcasts = await Podcast.find({
      status: "active",
      updatedAt: { $gte: startDate }, // Filter based on the updated date
    })
      .populate("host", "userName") // Populate host information
      .exec();

    // Calculate scores for each podcast based on listenCount, likes, shares, and comments
    const scoredPodcasts = trendingPodcasts.map((podcast) => {
      const score =
        podcast.listenCount * 0.5 + // Weight for listen count
        podcast.likes * 0.3 + // Weight for likes
        podcast.shares * 0.1 + // Weight for shares
        podcast.comments.length * 0.1; // Weight for comments
      return { ...podcast.toObject(), score }; // Convert to plain object and add score
    });

    // Sort podcasts by score in descending order and limit to top 10
    const sortedPodcasts = scoredPodcasts
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json(sortedPodcasts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching trending podcasts", error });
  }
};

// Like the podcast
export const likePodcast = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Assuming authentication middleware sets req.user

  try {
    const podcast = await Podcast.findById(id);
    if (!podcast) {
      return res.status(404).json({ message: "Podcast not found" });
    }

    // Check if user has already liked the podcast
    if (podcast.likedBy.includes(userId)) {
      // User already liked the podcast, so decrease the like count
      podcast.likes -= 1;
      podcast.likedBy = podcast.likedBy.filter(
        (user) => user.toString() !== userId
      );
    } else {
      // User likes the podcast
      podcast.likes += 1;
      podcast.likedBy.push(userId);
    }

    await podcast.save();
    res.json({ message: "Podcast like status updated", likes: podcast.likes });
  } catch (error) {
    res.status(500).json({ message: "Error updating like status", error });
  }
};

// Share the podcast
export const sharePodcast = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Assuming authentication middleware sets req.user

  try {
    const podcast = await Podcast.findById(id);
    if (!podcast) {
      return res.status(404).json({ message: "Podcast not found" });
    }

    // Check if user has already shared the podcast
    if (podcast.sharedBy.includes(userId)) {
      // User already shared the podcast, so decrease the share count
      podcast.shares -= 1;
      podcast.sharedBy = podcast.sharedBy.filter(
        (user) => user.toString() !== userId
      );
    } else {
      // User shares the podcast
      podcast.shares += 1;
      podcast.sharedBy.push(userId);
    }

    await podcast.save();
    res.json({
      message: "Podcast share status updated",
      shares: podcast.shares,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating share status", error });
  }
};

// Comment on the podcast
export const commentOnPodcast = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body; // Expecting { text: "Your comment" }
  const userId = req.user.id; // Assuming authentication middleware sets req.user

  try {
    const podcast = await Podcast.findById(id);
    if (!podcast) {
      return res.status(404).json({ message: "Podcast not found" });
    }

    // Add new comment to the comments array
    podcast.comments.push({ userId, text });
    await podcast.save();

    res.json({ message: "Comment added", comments: podcast.comments });
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error });
  }
};

// Get podcast stats
export const getPodcastStats = async (req, res) => {
  const podcastId = req.params.id; // Correctly access the ID from params

  try {
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) {
      return res.status(404).json({ message: "Podcast not found" });
    }

    res.status(200).json({
      message: "Podcast stats retrieved",
      totalListens: podcast.totalListens,
      episodeStats: podcast.episodeStats,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving stats", error });
  }
};

// Function to handle episode listen event
export const listenToEpisode = async (req, res) => {
  const { podcastId, episodeId } = req.body;

  try {
    // Update the total listens for the podcast
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) {
      return res.status(404).json({ message: "Podcast not found" });
    }

    // Increment the total listens
    podcast.totalListens += 1;

    // Update the episode stats
    const episodeStat = podcast.episodeStats.find(
      (stat) => stat.episodeId.toString() === episodeId
    );

    if (episodeStat) {
      // If the episode already exists in the stats, increment its listens
      episodeStat.listens += 1;
    } else {
      // If it doesn't exist, create a new entry for the episode
      podcast.episodeStats.push({ episodeId, listens: 1 });
    }

    // Save the updated podcast
    await podcast.save();

    res.status(200).json({ message: "Listen recorded", podcast });
  } catch (error) {
    res.status(500).json({ message: "Error updating stats", error });
  }
};
