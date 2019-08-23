const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const thisSchema = new Schema({
  pan_id: String,
  idK: String,
  delete_code: String
});

module.exports = mongoose.model("deleteMatch", thisSchema);
