const User = require("../../models/user");
const bcrypt = require("bcrypt");
const deleteFile = require("../utils/delete_file");
const jwt = require("jsonwebtoken");

const registerValidate = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      throw new Error("Please fill all the fields");
    }
    next();
  } catch (e) {
    return res.status(400).json({ status: "error", message: e.message });
  }
};

const loginValidate = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new Error("Email and Password are required");
    }
    next();
  } catch (e) {
    res.status(400).json({
      status: "error",
      message: e.message,
    });
  }
};

const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      throw new Error("Email already exists");
    }
    next();
  } catch (e) {
    return res.status(400).json({ status: "error", message: e.message });
  }
};

const strongPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const strongPass =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!strongPass.test(password)) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      throw new Error("Password is not strong enough");
    }
    const salt = await bcrypt.genSalt();
    const hashPass = await bcrypt.hash(req.body.password, salt);
    req.body.password = hashPass;
    next();
  } catch (e) {
    return res.status(400).json({ status: "error", message: e.message });
  }
};

const getUser = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) {
      throw new Error("Token not provided");
    }
    token = token.split(" ");
    if (token.length > 1) {
      token = token[1];
    } else {
      token = token[0];
    }
    const user = jwt.verify(token, process.env.ENCRYPTION_CODE);
    if (!user) {
      throw new Error("Invalid token");
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(400).json({ status: "error", message: e.message });
  }
};

module.exports = {
  registerValidate,
  loginValidate,
  checkEmail,
  strongPassword,
  getUser,
};
