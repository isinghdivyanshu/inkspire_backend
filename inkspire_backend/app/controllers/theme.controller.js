const Art = require("../../models/art");
const Theme = require("../../models/theme");
const deleteFile = require("../utils/delete_file");
const slugify = require("../utils/slugify");
const fs = require("fs");

const index = async (req, res) => {
  try {
    const themes = await Theme.find();
    return res.status(200).json({
      status: "success",
      message: "Themes Fetched Successfully.",
      themes: themes,
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong.",
    });
  }
};

const themeOfDay = async (req, res) => {
  try {
    const themes = await Theme.find();
    const idx = new Date().getDate() % themes.length;

    return res.status(200).json({
      status: "success",
      theme: themes[idx],
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong.",
    });
  }
}

const addHistory = async (req, res) => {
    try {
      const slug = req.params.slug;
      if (!slug) {
        return res.status(400).json({
          status: "error",
          message: "Slug is required",
        });
      }

      const theme = await Theme.findOne({ slug });
      if (!theme) {
        return res.status(404).json({
          status: "error",
          message: "Theme not found.",
        });
      }

      const { artist, art } = req.body;
      if (!artist || !art) {
        return res.status(400).json({
          status: "error",
          message: "artist and art is required",
        });
      }

      let image = "";
      let newFilename = "";
      if (req.file) {
        const historyCount = theme.history.length + 1;
        console.log(historyCount);
        let oldFilename = req.file.filename;
        let extension = oldFilename.split(".").pop();
        newFilename = `${slug}-h-${historyCount}.${extension}`;
        
        fs.rename(
          req.file.path,
          req.file.destination + "/" + newFilename,
          function (err) {
            if (err) {
              throw new Error("Error renaming file. Error: " + err);
            }
          }
        );
        image = "/theme/" + newFilename;
      } else {
        return res.status(400).json({
          status: "error",
          message: "Image is required"
        });
      }
      console.log(image);
      const historyEntry = {
        src: image,
        artist: JSON.parse(artist),
        art: JSON.parse(art)
      };

      theme.history.push(historyEntry);
      await theme.save();

      return res.status(200).json({
        status: "success",
        message: "History added successfully",
        theme,
        filename: newFilename
      });
    } catch (e) {
      console.log(e);
      if (req.file) {
        fs.existsSync(req.file.path) && deleteFile(req.file.path);
      }
      return res.status(500).json({
        status: "error",
        message: "Something went wrong.",
      });
    }
}

const show = async (req, res) => {
  try {
    const slug = req.params.slug;
    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "Slug is required",
      });
    }
    const theme = await Theme.findOne({ slug });

    if (!theme) {
      return res.status(404).json({
        status: "error",
        message: "Theme not found.",
      });
    }
    const arts = await Art.find({ theme: theme._id })
      .populate({ path: "artist", select: "id name" })
      .exec();

    return res.status(200).json({
      status: "success",
      message: "Theme fetched successfully.",
      theme: theme,
      arts: arts,
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong.",
    });
  }
};

const create = async (req, res) => {
  try {
    const { theme_title, theme_description, work_title, work_description, info_link } = req.body;
    let slug = slugify(theme_title);
    let i = 0;

    while (await Theme.findOne({ slug: slug })) {
      slug = slugify(theme_title, ++i);
    }

    if (!req.files || !Object.hasOwn(req.files, "theme_image") || !Object.hasOwn(req.files, "work_image")) {
      return res.status(400).json({
        status: "error",
        message: "Image is required",
      });
    }

    let theme_images = [];
    for (let idx = 0; idx < req.files["theme_image"].length; idx++) {
      const img = req.files["theme_image"][idx];
      let image = "";
      let extension = img.filename.split(".").pop();
      // Add number suffix for multiple images
      image = `${slug}-${idx + 1}.${extension}`;
      
      fs.rename(
        img.path,
        img.destination + "/" + image,
        function (err) {
          if (err) {
            throw new Error("Error renaming file. Error: " + err);
          }
        }
      );
      theme_images.push("/theme/" + image);
    }
    
    let work_images = [];
    for (let idx = 0; idx < req.files["work_image"].length; idx++) {
      const img = req.files["work_image"][idx];
      let image = "";
      let extension = img.filename.split(".").pop();
      // Add number suffix for multiple images
      image = `${slug}-work-${idx + 1}.${extension}`;
      
      fs.rename(
        img.path,
        img.destination + "/" + image,
        function (err) {
          if (err) {
            throw new Error("Error renaming file. Error: " + err);
          }
        }
      );
      work_images.push("/theme/" + image);
    }

    const theme = await Theme.create({
      slug,
      theme_title,
      theme_description,
      theme_images,
      work_images,
      work_description,
      work_title,
      info_link: info_link || null // Add info_link with null fallback
    });
    
    return res.status(200).json({
      status: "success",
      message: "Theme added successfully.",
      theme: theme
    });
  } catch (e) {
    if (req.file) {
      fs.existsSync(req.file.path) && deleteFile(req.file.path);
    }
    return res.status(500).json({
      status: "error",
      message: "Error adding theme. Error: " + e,
    });
  }
};

const edit = async (req, res) => {
  try {
    const { slug } = req.params;
    const { theme_title, theme_description, work_title, work_description, info_link } = req.body;
    let theme = await Theme.findOne({ slug });
    if (!theme) {
      return res
        .status(404)
        .json({ status: "error", message: "Theme not found" });
    }

    if (theme_title) {
      theme.theme_title = theme_title;
    }
    if (theme_description) {
      theme.theme_description = theme_description;
    }
    if (work_title) {
      theme.work_title = work_title;
    }
    if (work_description) {
      theme.work_description = work_description;
    }
    if (info_link !== undefined) theme.info_link = info_link; // Add info_link update

    if (req.files && Object.hasOwn(req.files, 'theme_image')) {
      let theme_images = [];
      for (let idx = 0; idx < req.files["theme_image"].length; idx++) {
        const file = req.files["theme_image"][idx];
        let extension = file.filename.split(".").pop();
        let image = `${slug}-${idx + 1}.${extension}`;
        
        fs.rename(
          file.path,
          file.destination + "/" + image,
          function (err) {
            if (err) {
              return res
                .status(500)
                .json({ status: "error", message: "File rename error" });
            }
          }
        );
        theme_images.push("/theme/" + image);
      }
      theme.theme_images = theme_images;
    }

    if (req.files && Object.hasOwn(req.files, 'work_image')) {
      let work_images = [];
      for (let idx = 0; idx < req.files["work_image"].length; idx++) {
        const file = req.files["work_image"][idx];
        let extension = file.filename.split(".").pop();
        let image = `${slug}-work-${idx + 1}.${extension}`;
        
        fs.rename(
          file.path,
          file.destination + "/" + image,
          function (err) {
            if (err) {
              return res
                .status(500)
                .json({ status: "error", message: "File rename error" });
            }
          }
        );
        work_images.push("/theme/" + image);
      }
      theme.work_images = work_images;
    }

    await theme.save();
    res.status(200).json({
      status: "success",
      message: "Theme updated successfully",
      theme,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
const destroy = async (req, res) => {
  try {
    const { slug } = req.params;
    let theme = await Theme.findOne({ slug });

    if (!theme) {
      return res
        .status(404)
        .json({ status: "error", message: "Theme not found" });
    }

    // if (theme.image) {
    //   fs.unlink(`path/to/images/${theme.image}`, (err) => {
    //     if (err) {
    //       return res
    //         .status(500)
    //         .json({ status: "error", message: "File deletion error" });
    //     }
    //   });
    // }

    await Theme.findByIdAndDelete(theme.id);
    res
      .status(200)
      .json({ status: "success", message: "Theme deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
// TODO: Select a random theme for theme of the day

module.exports = { index, show, create, edit, destroy, themeOfDay, addHistory };
