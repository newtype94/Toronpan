
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var littleCommentSchema = new Schema({
    contents : String,
    writer : String,
    sideJ : String, //left,right
    comment_date : {type: Date, default: Date.now()}
});

var commentSchema = new Schema({
    whatBoard : String,
    contents : String,
    writer : String,
    sideJ : String, //left,right
    comment_date : {type: Date, default: Date.now()},
    like_number : Number,
    likes : [String], //좋아요,싫어요 누른 사람들의 nameJ
    littleComment : [littleCommentSchema]
});

module.exports = mongoose.model('comment', commentSchema);
