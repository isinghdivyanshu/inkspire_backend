const mongoose = require("mongoose");
const { Schema } = mongoose;

const ArtSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: false,
  }],
  likes: {
    type: Number,
    default: 0,
  },
  published: {
    type: Boolean,
    default: false,
  },
  reviewed: {
    type: Boolean,
    default: false,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  artist: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  theme: {
    type: Schema.Types.ObjectId,
    ref: "Theme",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Art = mongoose.model("Art", ArtSchema);
module.exports = Art;
