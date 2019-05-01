
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var littleCommentSchema = new Schema({
    pan_id : String,
    idK : String,
    delete_code : String
});

module.exports = mongoose.model('deleteMatch', littleCommentSchema);
