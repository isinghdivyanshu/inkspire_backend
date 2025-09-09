const User = require("../../models/user");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendOTP = require("../mail/otp_verification");
const sendPasswordOTP = require("../mail/password_otp");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = new Date(Date.now() + 30 * 60 * 1000);
    if (req.file) {
      let filename =
        email.split(".")[0] + "." + req.file.filename.split(".")[1];
      fs.rename(
        req.file.path,
        req.file.destination + "/" + filename,
        function (err) {
          if (err) {
            throw new Error("Error renaming file. Error: " + err);
          }
        }
      );
      const image = "/images/users/" + filename;
      const user = await User.create({
        name,
        email,
        password,
        image,
        otp,
        otpExpires,
      });
      await user.save();
      if (!user) {
        throw new Error("Error creating user");
      }
    } else {
      const user = await User.create({
        name,
        email,
        password,
        otp,
        otpExpires,
      });
      await user.save();
      if (!user) {
        throw new Error("Error creating user");
      }
    }
    sendOTP(email, otp);
    return res
      .status(201)
      .json({ status: "success", message: "User created successfully" });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error(
        "User not found. Please check your email address and try again"
      );
    }
    if (!user.verifiedAt) {
      throw new Error("User not verified");
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid Password.");
    }
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.ENCRYPTION_CODE
    );
    return res.status(200).json({
      status: "success",
      message: "Successfully logged in.",
      token: token,
      user: {
        name: user.name,
        email: user.email,
        image: user.image,
        id: user.id,
      },
    });
  } catch (e) {
    return res.status(401).json({
      status: "error",
      message: e.message,
    });
  }
};

const verify = async (req, res) => {
  const { email, otp } = req.query;
  if (!email || !otp) {
    return res.status(400).json({
      status: "error",
      message: "Email and otp are required",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }
    if (user.otp != otp) {
      return res.status(400).json({
        status: "error",
        message: "Incorrect otp.",
      });
    }
    if (Date.parse(user.otpExpires) < Date.now()) {
      return res.status(400).json({
        status: "error",
        message: "OTP expired. Please request a new one.",
      });
    }

    user.verifiedAt = Date.now();
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    return res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: e.message,
    });
  }
};

const requestOtp = async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({
      status: "error",
      message: "Email is required",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }
    if (user.verifiedAt) {
      return res.status(400).json({
        status: "error",
        message: "User is already verified",
      });
    }
    if (Date.parse(user.otpExpires) - 25 * 60 * 1000 > Date.now()) {
      return res.status(400).json({
        status: "error",
        message: "Please wait for 5 minutes before requesting a new otp.",
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = new Date(Date.now() + 30 * 60 * 1000);
    await sendOTP(email, otp);
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    return res.status(200).json({
      status: "success",
      message: "An email with a new otp has been sent.",
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: e.message,
    });
  }
};

const forgotPasswordOtp = async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({
      status: "error",
      message: "Email is required",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }
    if (!user.verifiedAt) {
      return res.status(400).json({
        status: "error",
        message:
          "Please verify your account before proceeding for password reset.",
      });
    }
    if (Date.parse(user.otpExpires) - 25 * 60 * 1000 > Date.now()) {
      return res.status(400).json({
        status: "error",
        message: "Please wait for 5 minutes before requesting a new otp.",
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = new Date(Date.now() + 30 * 60 * 1000);
    await sendPasswordOTP(email, otp);
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    return res.status(200).json({
      status: "success",
      message: "Password Reset Otp sent successfully.",
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: e.message,
    });
  }
};

const setForgottenPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email, otp and new password is required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }
    if (!user.verifiedAt) {
      return res.status(400).json({
        status: "error",
        message: "User is not verified",
      });
    }
    if (user.otp != otp) {
      return res.status(400).json({
        status: "error",
        message: "Invalid otp",
      });
    }
    if (Date.parse(user.otpExpires) < Date.now()) {
      return res.status(400).json({
        status: "error",
        message: "OTP expired. Please request a new one.",
      });
    }
    user.password = password;
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    return res.status(200).json({
      status: "success",
      message: "Password reset successful.",
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: e.message,
    });
  }
};

module.exports = {
  register,
  login,
  verify,
  requestOtp,
  forgotPasswordOtp,
  setForgottenPassword,
};
