if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const routes = require("./routes/routes");
const mongoose = require("mongoose");
const cors = require('cors');
const multer = require('multer');
const path=require('path');

const port = 8000;
const app = express();
app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json({limit: '150mb'}));
app.use(express.urlencoded({limit: '150mb'}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Increase the request size limit for multer
const upload = multer({ limits: { fileSize: 150 * 1024 * 1024 } });
//static serves
app.use("/default", express.static(path.join(__dirname,  "public","placeholders")));
app.use("/images", express.static(path.join(__dirname, "public", "images")));
app.use("/theme", express.static(path.join(__dirname, "public", "theme")));


const testCORS = async () => {
  try {
    const response = await fetch('http://localhost:8000/test-cors', {
      credentials: 'include'
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('CORS Error:', error);
  }
}
// Database connection
mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("Database connected");
    app.listen(port, () => {
      console.log("Listening to port ", port);
    });
  })
  .catch((error) => {
    console.log("Database connection failed");
    console.error(error);
  });
// Routes connection
app.use("/", routes);
module.exports = app;
