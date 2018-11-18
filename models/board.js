
var mongoose = require('mongoose');

var boardSchema = new mongoose.Schema({
    title: String,
    contents: String,
    writer : String,
    writer_id : String,
    board_date: {type: Date, default: Date.now()},
    like_number : Number,
    likes : [String],
    hit : Number
});

module.exports = mongoose.model('board', boardSchema);
