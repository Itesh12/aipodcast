import Episode from "../models/episodeModel.js";
import Podcast from "../models/podcastModel.js";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";

// Set ffprobe path for fluent-ffmpeg
ffmpeg.setFfprobePath(ffprobeStatic.path);

// Create a new episode for a podcast
export const createEpisode = async (req, res) => {
  const { title, description, guest, coverPhoto } = req.body;
  const podcastId = req.params.podcastId; // Get podcastId from route parameters

  try {
    // Ensure the file exists (audio field)
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ message: "No audio file provided" });
    }

    const audioFilePath = req.files.audio[0].path; // Path to the uploaded audio file

    // Use ffprobe to get the duration of the audio file
    ffmpeg.ffprobe(audioFilePath, async (err, metadata) => {
      if (err) {
        console.error("Error processing audio file:", err); // Log the error
        return res
          .status(400)
          .json({ message: "Error processing audio file", err });
      }

      // Get duration in seconds
      const duration = metadata.format.duration;

      try {
        // Create the episode with the duration
        const newEpisode = new Episode({
          title,
          description,
          guest,
          coverPhoto,
          audioFileUrl: `${req.protocol}://${req.get("host")}/uploads/audio/${
            req.files.audio[0].filename
          }`, // Use audioFileUrl
          duration, // Save the duration in seconds
          podcast: podcastId, // Link the episode to the podcast
        });

        // Save the episode
        const episode = await newEpisode.save();

        // Update the Podcast model to include this episode
        await Podcast.findByIdAndUpdate(
          podcastId,
          { $push: { episodes: episode._id } }, // Add the episode to the podcast's episodes array
          { new: true, useFindAndModify: false } // Return the updated podcast
        );

        // Respond with the created episode
        res.status(201).json(episode);
      } catch (saveError) {
        console.error("Error saving episode:", saveError); // Log the error
        return res
          .status(400)
          .json({ message: "Error saving episode", saveError });
      }
    });
  } catch (error) {
    console.error("Error creating episode:", error); // Log the error
    res.status(500).json({ message: "Error creating episode", error });
  }
};

// Update an episode
export const updateEpisode = async (req, res) => {
  const { episodeId } = req.params;
  const { title, description, guest } = req.body;

  try {
    // Find the episode by ID
    const episode = await Episode.findById(episodeId);

    if (!episode) {
      return res.status(404).json({ message: "Episode not found" });
    }

    // If an audio file is uploaded, process it
    if (req.files && req.files.audio) {
      const audioFilePath = req.files.audio[0].path; // Assume `audio` is the key for the audio file

      // Use ffprobe to get the duration of the new audio file
      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioFilePath, async (err, metadata) => {
          if (err) {
            return reject(err);
          }
          const duration = metadata.format.duration; // Get duration in seconds
          episode.audioFileUrl = `${req.protocol}://${req.get(
            "host"
          )}/uploads/audio/${req.files.audio[0].filename}`; // Save new audio URL
          episode.duration = duration; // Save new duration
          resolve();
        });
      });
    }

    // If a cover photo is uploaded, update it
    if (req.files && req.files.coverPhoto) {
      episode.coverPhoto = `${req.protocol}://${req.get(
        "host"
      )}/uploads/images/${req.files.coverPhoto[0].filename}`; // Assume `coverPhoto` is the key for the cover photo file
    }

    // Update the metadata (title, description, guest)
    episode.title = title || episode.title;
    episode.description = description || episode.description;
    episode.guest = guest || episode.guest;

    // Save the updated episode
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
    // Find the episode by its ID and delete it
    const episode = await Episode.findByIdAndDelete(episodeId);
    if (!episode) {
      return res.status(404).json({ message: "Episode not found" });
    }

    // Remove the episode from the associated podcast's episodes array
    await Podcast.findByIdAndUpdate(
      episode.podcast, // Use the podcast ID from the episode
      { $pull: { episodes: episodeId } }, // Remove the episode from the podcast
      { new: true, useFindAndModify: false } // Return the updated podcast
    );

    res.json({
      message: "Episode deleted successfully and removed from podcast",
    });
  } catch (error) {
    res.status(400).json({ message: "Error deleting episode", error });
  }
};
