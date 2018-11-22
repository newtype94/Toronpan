
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var surveyDone = new Schema({
  done_people : [String],
  date: {type: Date, default: Date.now().toLocaleDateString}
});

module.exports = mongoose.model('surveyDone', surveyDone);
