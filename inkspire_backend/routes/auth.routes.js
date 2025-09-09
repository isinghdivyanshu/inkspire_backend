const { Router } = require("express");
const uploader = require("../app/middlewares/uploader.middleware");
const {
  registerValidate,
  checkEmail,
  strongPassword,
  loginValidate,
} = require("../app/middlewares/auth.middleware");
const {
  register,
  login,
  verify,
  requestOtp,
  forgotPasswordOtp,
  setForgottenPassword,
} = require("../app/controllers/auth.controller");
const convertToWebP = require("../app/middlewares/converter.middleware");
const setPath = require("../app/utils/set_path");
const router = Router();

router.post(
  "/register",
  setPath,
  uploader.single("image"),
  convertToWebP,
  registerValidate,
  checkEmail,
  strongPassword,
  register
);

router.post("/login", loginValidate, login);
router.get("/verify", verify);
router.get("/request-otp", requestOtp);
router.get("/reset-password", forgotPasswordOtp);
router.post("/set-forgotten-password", strongPassword, setForgottenPassword);

module.exports = router;
