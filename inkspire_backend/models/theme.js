const mongoose = require("mongoose");
const { Schema } = mongoose;

const ThemeSchema = new Schema({
  theme_title: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  theme_images: [{
    type: String,
    required: true,
  }],
  theme_description: {
    type: String,
    required: true,
  },
  info_link: {
    type: String,
    default: null
  },
  work_title: {
    type: String,
    required: true,
  },
  work_images: [{
    type: String,
    required: true,
  }],
  work_description: {
    type: String,
    required: true,
  },
  history: [{
    src: String,
    artist: {
      name: String,
      period: String,
    },
    art: {
      title: String,
      year: String,
    }
  }]
});

const Theme = mongoose.model("Theme", ThemeSchema);
module.exports = Theme;
