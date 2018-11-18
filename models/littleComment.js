
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var littleCommentSchema = new Schema({
    contents : String,
    writer : String,
    comment_date : {type: Date, default: Date.now()}
});

module.exports = mongoose.model('littleComment', littleCommentSchema);
