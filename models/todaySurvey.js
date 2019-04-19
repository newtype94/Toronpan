var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var stone = new Schema({
  idK: String,
  genderJ: String,
  ageJ: Number,
  sideJ: String,
  degree: Number
});

var todaySurvey = new Schema({
  firstQ : String,
  case1 : [stone],
  secondQ : String,
  case2 : [stone],
  date: {type: Date, default: Date.now().toLocaleDateString}
});

module.exports = mongoose.model('todaySurvey', todaySurvey);
