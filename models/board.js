const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema({
  title: String,
  field: Number, //1:정치토론, 2:일반토론, 3:취미,자유,질문
  fieldText: String, //it, game, style, travel, music, movie, free, ask
  contents: String,
  writer: String,
  writer_id: String, //user._id
  board_date: { type: Date, default: Date.now() },
  like_number: Number,
  likes: [String],
  exp_done: Boolean, //정산 유무
  exp_done_howmuch: Number, //정산된 수
  hit: Number
});

module.exports = mongoose.model("board", boardSchema);
