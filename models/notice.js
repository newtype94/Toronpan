const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema({
  title: String,
  contents: String,
  date: { type: Date, default: Date.now() }
});

module.exports = mongoose.model("notice", noticeSchema);
