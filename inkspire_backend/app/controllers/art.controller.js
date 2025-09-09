const Art = require("../../models/art");
const Theme = require("../../models/theme");
const User = require("../../models/user");
const fs = require("fs");
const path = require('path'); // Add this line
const slugify = require("../utils/slugify");
const stylizeImages = require("../utils/style-transfer");

const index = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = page || 1;
    limit = limit || 10;
    const count = await Art.countDocuments();

    const arts = await Art.find()
      .populate({ path: "artist", select: "id name" })
      .populate("theme")
      .skip((page - 1) * limit)
      .limit(limit);

    res.set('Content-Type', 'application/json');
    return res.status(200).json({
      status: "success",
      message: "Arts fetched successfully.",
      arts: arts,
      count: count,
    });
  } catch (e) {
    console.log(e);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const gallery = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = page || 1;
    limit = limit || 10;
    const count = await Art.countDocuments({ published: true, reviewed: true });

    const arts = await Art.find({ published: true, reviewed: true })
      .populate({ path: "artist", select: "id name" })
      .skip((page - 1) * limit)
      .limit(limit);

    res.set('Content-Type', 'application/json');
    return res.status(200).json({
      status: "success",
      message: "Arts fetched successfully.",
      arts: arts,
      count: count,
    });
  } catch (e) {
    console.log(e);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const userArts = async (req, res) => {
  try {
    let { page, limit } = req.query;
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "Id is required.",
      });
    }
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }
    page = page || 1;
    limit = limit || 10;
    const count = await Art.countDocuments({ artist: id });
    const arts = await Art.find({ artist: id })
      .populate({ path: "artist", select: "id name" })
      .skip((page - 1) * limit)
      .limit(limit);

    res.set('Content-Type', 'application/json');
    return res.status(200).json({
      status: "success",
      message: "Arts fetched successfully.",
      arts: arts,
      count: count,
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const themeArts = async (req, res) => {
  try {
    let { page, limit } = req.query;
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "Slug is required.",
      });
    }
    const theme = await Theme.findOne({ slug });
    if (!theme) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }
    page = page || 1;
    limit = limit || 1;
    const count = await Art.countDocuments();
    const arts = await Art.find({ theme: theme._id })
      .skip((page - 1) * limit)
      .limit(limit);

    res.set('Content-Type', 'application/json');
    return res.status(200).json({
      status: "success",
      message: "Arts fetched successfully.",
      arts: arts,
      count: count,
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const show = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "slug is required.",
      });
    }
    const art = await Art.findOne({ slug: slug })
      .populate("theme")
      .populate({ path: "artist", select: "id name" });
    if (!art) {
      return res.status(404).json({
        status: "error",
        message: "Art not found.",
      });
    }

    res.set('Content-Type', 'application/json');
    return res.status(200).json({
      status: "success",
      message: "Art fetched successfully.",
      art: art,
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const like = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "slug is required.",
      });
    }
    const art = await Art.findOne({ slug: slug }).select('+likedBy');

    if (!art) {
      return res.status(404).json({
        status: "error",
        message: "Art not found.",
      });
    }

    if (art.likedBy.includes(userId)) {
      art.likedBy = art.likedBy.filter(id => id.toString() !== userId);
      art.likes = art.likedBy.length;
      await art.save();
      res.set('Content-Type', 'application/json');
      res.status(200).send({
        message: 'Art unliked successfully',
          likes: art.likes,
      });
    } else {
      art.likedBy.push(userId);
      art.likes = art.likedBy.length;
      await art.save();
      res.set('Content-Type', 'application/json');
      res.status(200).send({
        message: 'Art liked successfully',
        likes: art.likes,
      });
    }

  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const convertBase64ToBuffer = (base64String) => {
  // Remove data:image/jpeg;base64, if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

const model = async (req, res) => {
  try {
    const contentImage = req.files?.content_image?.[0] || req.body.content_image;
    const styleImage = req.files?.style_image?.[0] || req.body.style_image;

    if (!contentImage || !styleImage) {
      return res.status(400).json({
        status: "error",
        message: "Both content and style images are required.",
      });
    }

    const contentBuffer = contentImage.buffer || convertBase64ToBuffer(contentImage);
    const styleBuffer = styleImage.buffer || convertBase64ToBuffer(styleImage);

    const contentImageObj = { buffer: contentBuffer };
    const styleImageObj = { buffer: styleBuffer };

    const styled_image = await stylizeImages(contentImageObj, styleImageObj);
    const base64Image = `data:image/jpeg;base64,${styled_image.toString('base64')}`;

    res.set('Content-Type', 'application/json');
    return res.status(201).json({
      status: "success",
      message: "Image styled successfully",
      image: base64Image
    });

  } catch (e) {
    console.log(e);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong.",
    });
  }
}

const create = async (req, res) => {
  try {
    let { title, description, theme, image } = req.body;
    
    if (!theme) {
      return res.status(400).json({
        status: "error",
        message: "Theme is required.",
      });
    }
    
    if (!image) {
      return res.status(400).json({
        status: "error",
        message: "Image (base64) is required.",
      });
    }
    
    if (!title || !description) {
      return res.status(400).json({
        status: "error",
        message: "Title and Description are required.",
      });
    }

    // Find or create theme
    let themeDoc = await Theme.findOne({ slug: slugify(theme) });
    if (!themeDoc) {
      themeDoc = await Theme.create({
        name: theme,
        slug: slugify(theme),
        description: `User defined theme: ${theme}`,
        createdBy: req.user.id
      });
    }

    let slug = slugify(title);
    let i = 0;
    while (await Art.findOne({ slug: slug })) {
      slug = slugify(title, ++i);
    }

    // Ensure directory exists
    const uploadDir = path.join('public/images/arts', themeDoc.slug);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save base64 image
    const filename = `${slug}.jpg`;
    const filePath = path.join(uploadDir, filename);
    
    // Convert base64 to buffer and save
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    
    // Create database entry
    const art = await Art.create({
      title,
      description,
      theme: themeDoc.id,
      image: `/images/arts/${themeDoc.slug}/${filename}`,
      artist: req.user.id,
      slug,
    });

    return res.status(201).json({
      status: "success",
      message: "Art created successfully.",
      art: art,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong.",
    });
  }
};

const edit = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "Slug is required.",
      });
    }
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        status: "error",
        message: "Title and Description are required.",
      });
    }
    const art = await Art.findOne({ slug });
    if (req.user.id !== art.artist.toString()) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to perform this action.",
      });
    }
    if (!art) {
      return res.status(404).json({
        status: "error",
        message: "Art not found.",
      });
    }
    art.title = title;
    art.description = description;
    await art.save();

    res.set('Content-Type', 'application/json');
    return res.status(200).json({
      status: "success",
      message: "Art updated successfully.",
      art: art,
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong.",
    });
  }
};

const remove = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "Slug is required.",
      });
    }
    const art = await Art.findOne({ slug });
    if (!art) {
      return res.status(404).json({
        status: "error",
        message: "Art not found.",
      });
    }
    if (req.user.id !== art.artist.toString()) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to perform this action.",
      });
    }

    const filePath = path.join('public', art.image);
    fs.unlinkSync(filePath);

    await Art.findOneAndDelete({ slug });

    res.set('Content-Type', 'application/json');
    return res.status(200).json({
      status: "success",
      message: "Art removed successfully.",
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong.",
    });
  }
};

const review = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "Slug is required.",
      });
    }
    const art = await Art.findOne({ slug });
    if (!art) {
      return res.status(404).json({
        status: "error",
        message: "Art not found.",
      });
    }

    art.reviewed = !art.reviewed;
    await art.save();

    res.set('Content-Type', 'application/json');
    return res.status(200).json({
      status: "success",
      message: "Art reviewed successfully.",
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong.",
    });
  }
};

const publish = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "Slug is required.",
      });
    }
    const art = await Art.findOne({ slug });
    if (!art) {
      return res.status(404).json({
        status: "error",
        message: "Art not found.",
      });
    }
    if (req.user.id !== art.artist.toString()) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to perform this action.",
      });
    }

    art.published = !art.published;
    await art.save();

    res.set('Content-Type', 'application/json');
    return res.status(200).json({
      status: "success",
      message: "Art published/unpublished successfully.",
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong.",
    });
  }
};

module.exports = {
  index,
  userArts,
  themeArts,
  show,
  create,
  edit,
  remove,
  like,
  publish,
  review,
  gallery,
  model,
};
