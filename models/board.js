
var mongoose = require('mongoose');

var boardSchema = new mongoose.Schema({
    field : Number, //1:정치, 2:경제, 3:사회, 4:자유
    title : String,
    contents: String,
    writer : String,
    writer_id : String,
    board_date: {type: Date, default: Date.now()},
    like_number : Number,
    likes : [String],
    exp_done : Boolean,
    exp_done_howmuch : Number,
    hit : Number
});

module.exports = mongoose.model('board', boardSchema);
