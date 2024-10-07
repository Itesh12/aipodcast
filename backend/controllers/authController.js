import User from "../models/userModel.js";
import { handleError } from "../utils/errorHandler.js";
import { generateToken } from "../utils/generateToken.js"; // Assuming you have a utility function for token generation

import { body, validationResult } from "express-validator";

// Utility function to format total listening time
const formatListeningTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}hr ${minutes}min ${seconds}s`;
};

export const registerUser = async (req, res) => {
  // Validate input
  await body("email")
    .isEmail()
    .withMessage("Email is required and must be a valid email")
    .run(req);
  await body("userName")
    .notEmpty()
    .withMessage("Username is required")
    .run(req);
  await body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userName, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const userNameExists = await User.findOne({ userName });
    if (userNameExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = await User.create({
      userName,
      email,
      password,
      interests: [], // Initialize interests as an empty array
    });

    // Generate and save token
    const token = generateToken(user._id);
    user.token = token; // Save token to the user record
    await user.save(); // Save updated user

    res.status(200).json({
      _id: user._id,
      userName: user.userName,
      email: user.email,
      token: token, // Return the token to the client
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        _id: user._id,
        userName: user.userName,
        email: user.email,
        token: user.token,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    handleError(res, error);
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
};

export const updateUserProfile = async (req, res) => {
  const {
    userName,
    bio,
    websiteLinks,
    favoritePodcasts,
    subscribedPodcasts,
    createdPodcasts,
    notificationsPreferences,
    languagePreferences,
    preferredCategories,
    totalListeningTime,
    interests, // This can be a string or an array
  } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (user) {
      // Update basic fields
      user.userName = userName || user.userName;
      user.bio = bio || user.bio;
      user.websiteLinks = websiteLinks || user.websiteLinks;
      user.favoritePodcasts = favoritePodcasts || user.favoritePodcasts;
      user.subscribedPodcasts = subscribedPodcasts || user.subscribedPodcasts;
      user.createdPodcasts = createdPodcasts || user.createdPodcasts;
      user.notificationsPreferences =
        notificationsPreferences !== undefined
          ? notificationsPreferences
          : user.notificationsPreferences;
      user.languagePreferences =
        languagePreferences || user.languagePreferences;
      user.preferredCategories =
        preferredCategories || user.preferredCategories;
      user.totalListeningTime = totalListeningTime || user.totalListeningTime;

      // Handle profile picture update
      if (req.file) {
        user.profilePicture = `${req.protocol}://${req.get("host")}/uploads/${
          req.file.filename
        }`;
      }

      // Log the user interests before update
      console.log("User interests before update:", user.interests);

      // Parse the interests if it's coming as a string
      let parsedInterests = interests;
      if (typeof interests === "string") {
        try {
          parsedInterests = JSON.parse(interests);
        } catch (error) {
          console.error("Error parsing interests:", error);
        }
      }

      // If parsedInterests is now an array, append to existing interests
      if (Array.isArray(parsedInterests)) {
        user.interests = [...new Set([...user.interests, ...parsedInterests])]; // Merge and remove duplicates
      }

      // Log the user interests after update
      console.log("User interests after update:", user.interests);

      const updatedUser = await user.save();

      // Log the updated user after saving
      console.log("Updated user after save:", updatedUser);

      res.json({
        _id: updatedUser._id,
        userName: updatedUser.userName,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        bio: updatedUser.bio,
        websiteLinks: updatedUser.websiteLinks,
        favoritePodcasts: updatedUser.favoritePodcasts,
        subscribedPodcasts: updatedUser.subscribedPodcasts,
        createdPodcasts: updatedUser.createdPodcasts,
        notificationsPreferences: updatedUser.notificationsPreferences,
        languagePreferences: updatedUser.languagePreferences,
        preferredCategories: updatedUser.preferredCategories,
        totalListeningTime: updatedUser.totalListeningTime,
        interests: updatedUser.interests,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(500).json({ message: "Error updating user profile", error });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // Update password
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

export const initiatePasswordReset = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with that email does not exist" });
    }

    // Send reset token logic (could be an email with a token or a link)
    const resetToken = generateResetToken(); // Example function
    // Send token via email

    res.json({ message: "Password reset email sent", resetToken }); // Don't send the token directly, just for demo purposes
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    handleError(res, error);
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
  const { newEpisodes, podcastUpdates } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.notificationsPreferences.newEpisodes =
      newEpisodes !== undefined
        ? newEpisodes
        : user.notificationsPreferences.newEpisodes;
    user.notificationsPreferences.podcastUpdates =
      podcastUpdates !== undefined
        ? podcastUpdates
        : user.notificationsPreferences.podcastUpdates;

    await user.save();
    res.status(200).json({
      message: "Notification preferences updated",
      preferences: user.notificationsPreferences,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res
      .status(500)
      .json({ message: "Error updating notification preferences", error });
  }
};

// Update listening time for the user
export const updateListeningTime = async (req, res) => {
  const userId = req.user._id;
  const { episodeDuration } = req.body; // Duration in seconds

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure episodeDuration is a number
    const durationInSeconds = Number(episodeDuration); // Ensure it's a number
    if (isNaN(durationInSeconds)) {
      return res.status(400).json({ message: "Invalid episode duration" });
    }

    // Update totalListeningTime correctly
    user.totalListeningTimeInSec += durationInSeconds; // Increment by episode duration

    // Log the values to debug
    console.log(`Before Save: ${user.totalListeningTimeInSec}`); // For debugging

    await user.save(); // Ensure it's saved correctly

    // Return the total listening time as a string for response
    res.status(200).json({
      message: "Listening time updated",
      totalListeningTimeInSec: user.totalListeningTimeInSec.toString(), // Convert to string for response
    });
  } catch (error) {
    console.error("Error updating listening time:", error);
    res.status(500).json({ message: "Error updating listening time", error });
  }
};
