// import multer from "multer";
// import path from "path";

// // Set storage engine
// const storage = multer.diskStorage({
//   destination: "./uploads/",
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       file.fieldname + "-" + Date.now() + path.extname(file.originalname)
//     ); // Append extension
//   },
// });

// // Initialize upload
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 1000000 }, // Limit file size to 1MB
//   fileFilter: (req, file, cb) => {
//     const filetypes = /jpeg|jpg|png|gif/;
//     const extname = filetypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     const mimetype = filetypes.test(file.mimetype);

//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb("Error: Images Only!");
//     }
//   },
// }).single("image"); // The field name for the profile picture in FormData

// export default upload;

import multer from "multer";

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "audio") {
      cb(null, "uploads/audio/");
    } else if (file.fieldname === "coverPhoto") {
      cb(null, "uploads/images/");
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Ensure unique filenames
  },
});

// Define the multer upload with specific field names for audio and coverPhoto
export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Increase to 20MB
}).fields([
  { name: "audio", maxCount: 1 }, // Accept only 1 audio file
  { name: "coverPhoto", maxCount: 1 }, // Accept only 1 cover photo file
]);

export default upload;
