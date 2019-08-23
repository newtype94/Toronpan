const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stone = new Schema({
  idK: String,
  genderJ: String,
  ageJ: Number,
  sideJ: String,
  degree: Number
});

const todaySurvey = new Schema({
  firstQ: String,
  case1: [stone],
  secondQ: String,
  case2: [stone],
  date: { type: Date, default: Date.now().toLocaleDateString }
});

module.exports = mongoose.model("todaySurvey", todaySurvey);
