import Episode from "../models/episodeModel.js";
import Podcast from "../models/podcastModel.js";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";

// Set ffprobe path for fluent-ffmpeg
ffmpeg.setFfprobePath(ffprobeStatic.path);

// Helper function to format the duration into '1hr 30min'
const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}hr ${m}min` : `${m}min`;
};

// Create a new episode for a podcast
export const createEpisode = async (req, res) => {
  const { title, description, guest, coverPhoto } = req.body;
  const podcastId = req.params.podcastId;

  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ message: "No audio file provided" });
    }

    const audioFilePath = req.files.audio[0].path;

    // Use ffprobe to get the duration of the audio file
    ffmpeg.ffprobe(audioFilePath, async (err, metadata) => {
      if (err) {
        console.error("Error processing audio file:", err);
        return res
          .status(400)
          .json({ message: "Invalid or corrupted audio file", err });
      }

      // Get duration and format it into human-readable format
      const duration = formatDuration(metadata.format.duration);

      try {
        const newEpisode = new Episode({
          title,
          description,
          guest,
          coverPhoto,
          audioFileUrl: `${req.protocol}://${req.get("host")}/uploads/audio/${
            req.files.audio[0].filename
          }`,
          duration, // Store formatted duration
          podcast: podcastId,
        });

        // Save the episode
        const episode = await newEpisode.save();

        // Update the Podcast model to include this episode
        await Podcast.findByIdAndUpdate(
          podcastId,
          { $push: { episodes: episode._id } },
          { new: true, useFindAndModify: false }
        );

        res.status(201).json(episode);
      } catch (saveError) {
        console.error("Error saving episode:", saveError);
        return res
          .status(400)
          .json({ message: "Error saving episode", saveError });
      }
    });
  } catch (error) {
    console.error("Error creating episode:", error);
    res.status(500).json({ message: "Error creating episode", error });
  }
};

// Update an episode
export const updateEpisode = async (req, res) => {
  const { episodeId } = req.params;
  const { title, description, guest } = req.body;

  try {
    const episode = await Episode.findById(episodeId);

    if (!episode) {
      return res.status(404).json({ message: "Episode not found" });
    }

    // If an audio file is uploaded, process it
    if (req.files && req.files.audio) {
      const audioFilePath = req.files.audio[0].path;

      // Use ffprobe to get the duration of the new audio file
      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioFilePath, async (err, metadata) => {
          if (err) {
            return reject(new Error("Error processing new audio file"));
          }
          const duration = formatDuration(metadata.format.duration); // Format duration
          episode.audioFileUrl = `${req.protocol}://${req.get(
            "host"
          )}/uploads/audio/${req.files.audio[0].filename}`;
          episode.duration = duration;
          resolve();
        });
      });
    }

    // If a cover photo is uploaded, update it
    if (req.files && req.files.coverPhoto) {
      episode.coverPhoto = `${req.protocol}://${req.get(
        "host"
      )}/uploads/images/${req.files.coverPhoto[0].filename}`;
    }

    // Update metadata
    episode.title = title || episode.title;
    episode.description = description || episode.description;
    episode.guest = guest || episode.guest;

    const updatedEpisode = await episode.save();
    res.json(updatedEpisode);
  } catch (error) {
    res.status(400).json({ message: "Error updating episode", error });
  }
};

// Delete an episode
export const deleteEpisode = async (req, res) => {
  const { episodeId } = req.params;

  try {
    const episode = await Episode.findByIdAndDelete(episodeId);
    if (!episode) {
      return res.status(404).json({ message: "Episode not found" });
    }

    await Podcast.findByIdAndUpdate(
      episode.podcast,
      { $pull: { episodes: episodeId } },
      { new: true, useFindAndModify: false }
    );

    res.json({
      message: "Episode deleted successfully and removed from podcast",
    });
  } catch (error) {
    res.status(400).json({ message: "Error deleting episode", error });
  }
};

// Controller function to mark an episode as played
export const markEpisodeAsPlayed = async (req, res) => {
  const { episodeId } = req.body; // Assuming the episode ID is sent in the request body
  const userId = req.user._id;

  try {
    const episode = await Episode.findById(episodeId);
    if (!episode) {
      return res.status(404).json({ message: "Episode not found" });
    }

    // Check if the episode is already marked as played
    if (!episode.playedBy.includes(userId)) {
      episode.playedBy.push(userId); // Mark the episode as played by the user
      await episode.save();
      return res
        .status(200)
        .json({ message: "Episode marked as played", episode });
    }

    res.status(400).json({ message: "Episode already marked as played" });
  } catch (error) {
    console.error("Error marking episode as played:", error);
    res.status(500).json({ message: "Error marking episode as played", error });
  }
};

// Controller function to unmark an episode as played
export const unmarkEpisodeAsPlayed = async (req, res) => {
  const { episodeId } = req.body;
  const userId = req.user._id;

  try {
    const episode = await Episode.findById(episodeId);
    if (!episode) {
      return res.status(404).json({ message: "Episode not found" });
    }

    console.log("Episode found:", episode);
    console.log("User ID:", userId);
    console.log("Played By:", episode.playedBy);

    // Check if the episode is marked as played by the user
    if (episode.playedBy.includes(userId)) {
      console.log("User is in playedBy array. Removing...");

      episode.playedBy = episode.playedBy.filter(
        (id) => id.toString() !== userId.toString() // Ensure comparison is done as strings
      ); // Unmark the episode as played
      await episode.save();
      return res
        .status(200)
        .json({ message: "Episode unmarked as played", episode });
    }

    res.status(400).json({ message: "Episode is not marked as played" });
  } catch (error) {
    console.error("Error unmarking episode as played:", error);
    res
      .status(500)
      .json({ message: "Error unmarking episode as played", error });
  }
};
