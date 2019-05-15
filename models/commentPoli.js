
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var littleCommentSchema = new Schema({
    contents : String, //내용
    writer : String, //닉네임
    sideJ : String, //left,right
    comment_date : {type: Date, default: Date.now()} //대댓글 단 시간
});

var commentSchema = new Schema({
    whatBoard : String, //목적지
    contents : String, //내용
    writer : String, //닉네임
    sideJ : String, //left,right
    comment_date : {type: Date, default: Date.now()}, //댓글 단 시간
    like_number : Number, //좋아요 수
    likes : [String], //좋아요,싫어요 누른 사람들의 nameJ
    littleComment : [littleCommentSchema],
    exp_done : Boolean, //정산 유무
    exp_done_howmuch : Number //정산 완료된 like_number
});

module.exports = mongoose.model('commentPoli', commentSchema);
