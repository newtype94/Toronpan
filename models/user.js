var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
  idK: String, //카카오 토큰
  nameK: String, //실명
  nameJ: String, //토론판 닉네임
  genderJ: String, //m , f
  yearJ: Number, //연령대
  ageJ: Number, //출생연도
  sideJ: String, //left, right
  exp: Number, //경험치
  level: Number //레벨
});

module.exports = mongoose.model('user', userSchema);
