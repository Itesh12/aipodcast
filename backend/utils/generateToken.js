import jwt from "jsonwebtoken";

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "3000d", // Token valid for 30 days
  });
};
