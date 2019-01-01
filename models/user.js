var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
  idK: String, //카카오 토큰
  nameK: String, //실명
  nameJ: String, //정치판 닉네임
  genderJ: String,
  ageJ: Number,
  sideJ: String, //
  exp: Number,
  level: Number
});

module.exports = mongoose.model('user', userSchema);
