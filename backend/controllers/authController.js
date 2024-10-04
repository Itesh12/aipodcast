import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { handleError } from "../utils/errorHandler.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

import { body, validationResult } from "express-validator";

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
      interests: [],
    }); // Initialize interests as an empty array

    res.status(201).json({
      _id: user._id,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        token: generateToken(user._id),
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
  } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.userName = userName || user.userName;

      // Update profile picture if it exists
      if (req.file) {
        user.profilePicture = `${req.protocol}://${req.get("host")}/uploads/${
          req.file.filename
        }`;
      }

      user.bio = bio || user.bio;
      user.websiteLinks = websiteLinks || user.websiteLinks;
      user.favoritePodcasts = favoritePodcasts || user.favoritePodcasts;
      user.subscribedPodcasts = subscribedPodcasts || user.subscribedPodcasts;
      user.createdPodcasts = createdPodcasts || user.createdPodcasts;
      user.notificationsPreferences =
        notificationsPreferences !== undefined
          ? notificationsPreferences
          : user.notificationsPreferences;

      // Directly assign languagePreferences
      user.languagePreferences = languagePreferences; // Removed array check for testing

      user.preferredCategories =
        preferredCategories || user.preferredCategories;

      // Update totalListeningTime if provided
      user.totalListeningTime = totalListeningTime || user.totalListeningTime;

      // Log user before saving
      console.log("User before save:", user);

      const updatedUser = await user.save();

      // Log updated user after saving
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
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error saving user:", error);
    handleError(res, error);
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
