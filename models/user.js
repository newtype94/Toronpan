var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
    idK : String,
    nameK : String,
    nameJ : String,
    genderJ : String,
    ageJ : Number,
    sideJ : String,
    exp : Number,
    level : Number
});

module.exports = mongoose.model('user', userSchema);
