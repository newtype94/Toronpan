var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
  idK: String, //카카오 토큰
  nameK: String, //실명
  nameJ: String, //토론판 닉네임
  genderJ: String, //m , f
  yearJ: Number, //출생연도
  ageJ: Number, //연령대
  sideJ: String, //left, right
  exp: Number, //경험치
  locate: String, //지역
  level: Number //레벨
});

module.exports = mongoose.model('user', userSchema);
