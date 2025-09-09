const setPath = async (req, res, next) => {
  const baseUrl = req.baseUrl;
  req.dir = `public/uploads/${baseUrl}`;
  if (baseUrl == "auth") {
    req.dir = "public/uploads/users";
  }
  next();
};

module.exports = setPath;
