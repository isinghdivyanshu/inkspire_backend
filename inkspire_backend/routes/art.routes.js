const { Router } = require("express");
const router = Router();
const multer = require("multer");
const uploader = require("../app/middlewares/uploader.middleware");
const { setPath } = require("../app/middlewares/art.middleware");
const { getUser } = require("../app/middlewares/auth.middleware");
const {
  create,
  index,
  userArts,
  show,
  edit,
  like,
  remove,
  publish,
  review,
  gallery,
  model,
} = require("../app/controllers/art.controller");
const convertToWebP = require("../app/middlewares/converter.middleware");
const { verify } = require("../app/middlewares/theme.middleware");

router.get("/user/:id", userArts);
router.post(
  "/create",
  getUser,
  setPath,
  uploader.single("image"),
  convertToWebP,
  create
);

const memoryStorage = multer.memoryStorage();
const uploadToMemory = multer({ storage: memoryStorage });

router.post(
  "/model",
  getUser,
  setPath,
  uploadToMemory.fields([
    { name: "content_image", maxCount: 1 },
    { name: "style_image", maxCount: 1 }
  ]),
  convertToWebP,
  model
);

router.post("/like/:slug", getUser, like);
router.post("/publish/:slug", getUser, publish);
router.post("/review/:slug", verify, review);

router.get("/", index);
router.get("/gallery", gallery);

router.get("/:slug", show);
router.put("/:slug", getUser, edit);
router.delete("/:slug", getUser, remove);

module.exports = router;
