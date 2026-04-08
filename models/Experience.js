const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const experienceSchema = new Schema({
  alumniId:          { type: Schema.Types.ObjectId, ref: "User", required: true },
  alumniName:        { type: String, required: true },
  company:           { type: String, required: true },
  jobRole:           { type: String, required: true },
  batch:             { type: String },
  offerReceived:     { type: Boolean, default: false },
  ctc:               { type: String, default: "Not disclosed" },
  rounds:            { type: String, required: true },   // free text describing rounds
  tips:              { type: String },
  overallExperience: { type: String, required: true },
}, { timestamps: true });
 
module.exports = mongoose.model("Experience", experienceSchema);