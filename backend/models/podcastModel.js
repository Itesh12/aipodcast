// import mongoose from "mongoose";

// const podcastSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   host: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   episodes: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Episode",
//     },
//   ],
//   status: {
//     type: String,
//     enum: ["active", "inactive", "archived"],
//     default: "active",
//   },
//   metadata: {
//     genre: [String],
//     language: [String],
//     duration: String, // e.g., "1hr 30min"
//   },
//   listenCount: {
//     type: Number,
//     default: 0,
//   },
//   likes: {
//     type: Number,
//     default: 0,
//   },
//   likedBy: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   ],
//   shares: {
//     type: Number,
//     default: 0,
//   },
//   sharedBy: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   ],
//   comments: [
//     {
//       userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true,
//       },
//       text: {
//         type: String,
//         required: true,
//       },
//       createdAt: {
//         type: Date,
//         default: Date.now,
//       },
//     },
//   ],
//   subscriberCount: {
//     type: Number,
//     default: 0,
//   },
//   coverPhoto: {
//     type: String,
//     default: null, // or remove required: true to make it optional
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// const Podcast = mongoose.model("Podcast", podcastSchema);
// export default Podcast;

import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const podcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    metadata: {
      genre: {
        type: [String],
        default: [],
      },
      language: [String],
      duration: String, // e.g., "1hr 30min"
    },
    coverPhoto: {
      type: String,
    },
    episodes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Episode",
      },
    ],
    listenCount: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sharedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [commentSchema],
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Podcast = mongoose.model("Podcast", podcastSchema);

export default Podcast;
