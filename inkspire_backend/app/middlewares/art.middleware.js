const checkTheme = async (req, res, next) => {
  let { theme } = req.body;
  if (!theme) {
    return res.status(400).json({
      status: "error",
      message: "Theme is required.",
    });
  }
  theme = await Theme.findOne({ slug: theme });
  if (!theme) {
    return res.status(404).json({
      status: "error",
      message: "Theme not found.",
    });
  }
  req.theme = theme;
  next();
};

const setPath = async (req, res, next) => {
  req.dir = "public/uploads/arts";
  next();
};

module.exports = { checkTheme, setPath };
