const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const surveyDone = new Schema({
  done_people: [String],
  date: { type: Date, default: Date.now().toLocaleDateString }
});

module.exports = mongoose.model("surveyDone", surveyDone);
