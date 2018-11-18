
var mongoose = require('mongoose');

var limitSchema = new mongoose.Schema({
    writer : String,
    howMany : Number,
    date: {type: Date, default: Date.now().toLocaleDateString}
});

module.exports = mongoose.model('writeLimit', limitSchema);
