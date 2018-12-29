
var mongoose = require('mongoose');

var boardSchema = new mongoose.Schema({
    title: String,
    field : Number, //1:정치, 2:사회
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
