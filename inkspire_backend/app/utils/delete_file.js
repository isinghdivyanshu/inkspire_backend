const fs = require("fs");
const deleteFile = async (path) => {
  try {
    fs.unlink(path, (err) => {
      if (err) {
        throw new Error("Error deleting file. Error: " + err);
      }
    });
  } catch (e) {
    throw new Error(e.message);
  }
};

module.exports = deleteFile;
