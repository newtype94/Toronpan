
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var littleCommentSchema = new Schema({
    contents : String,
    writer : String,
    sideJ : String,
    comment_date : {type: Date, default: Date.now()}
});

var commentSchema = new Schema({
    whatBoard : String,
    contents : String,
    writer : String,
    comment_date : {type: Date, default: Date.now()},
    like_number : Number,
    likes : [String],
    littleComment : [littleCommentSchema]
});

module.exports = mongoose.model('comment', commentSchema);
