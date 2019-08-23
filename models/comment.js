const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const littleCommentSchema = new Schema({
  contents: String,
  writer: String,
  sideJ: String, //left,right
  comment_date: { type: Date, default: Date.now() }
});

const commentSchema = new Schema({
  whatBoard: String,
  contents: String,
  writer: String, //nameJ
  comment_date: { type: Date, default: Date.now() },
  like_number: Number,
  likes: [String], //좋아요,싫어요 누른 사람들의 nameJ
  littleComment: [littleCommentSchema]
});

module.exports = mongoose.model("comment", commentSchema);
