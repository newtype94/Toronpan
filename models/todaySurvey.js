var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var user = new Schema({
  idK: String,
  genderJ: String,
  ageJ: Number,
  sideJ: String,
});

var todaySurvey = new Schema({
  firstQ : String,
  first_1 : [user],
  first_2 : [user],
  first_3 : [user],
  first_4 : [user],
  first_5 : [user],
  date: {type: Date, default: Date.now().toLocaleDateString}
});

module.exports = mongoose.model('todaySurvey', todaySurvey);
