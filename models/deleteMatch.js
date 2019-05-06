
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var thisSchema = new Schema({
    pan_id : String,
    idK : String,
    delete_code : String
});

module.exports = mongoose.model('deleteMatch', thisSchema);
