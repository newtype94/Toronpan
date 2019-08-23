const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const littleCommentSchema = new Schema({
  contents: String,
  writer: String,
  comment_date: { type: Date, default: Date.now() }
});

module.exports = mongoose.model("littleComment", littleCommentSchema);
