const verify = (req, res, next) => {
  const password = req.headers.password;
  if (!password) {
    return res.status(401).json({
      status: "error",
      message: "Password is required",
    });
  }
  if (password != process.env.ADMIN_PASS) {
    return res.status(401).json({
      status: "error",
      message: "Incorrect password.",
    });
  }
  next();
};

const setPath = (req, res, next) => {
  req.dir = "public/theme/";
  next();
};

module.exports = { verify, setPath };
