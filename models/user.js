const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const topicSchema = new Schema({
  name:   { type: String },
  solved: { type: Number, default: 0 },
  total:  { type: Number, default: 0 },
  color:  { type: String, default: "#2563eb" }
});

const userSchema = new Schema({
  name:            { type: String, required: true },
  email:           { type: String, required: true, unique: true },
  password:        { type: String, required: true },
  role:            { type: String, enum: ["student", "alumni"], default: "student" },
  branch:          { type: String, default: "CSE" },
  batch:           { type: Number, default: 2026 },
  company:         { type: String, default: "" },
  jobRole:         { type: String, default: "" },
  dsaSolved:       { type: Number, default: 0 },
  mockScore:       { type: Number, default: 0 },
  overallProgress: { type: Number, default: 0 },
  streak:          { type: Number, default: 0 },
  solvedQuestions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
  topics:          { type: [topicSchema], default: [
    { name: "DSA",      solved: 0, total: 200, color: "#2563eb" },
    { name: "Aptitude", solved: 0, total: 100, color: "#10b981" },
    { name: "Core CS",  solved: 0, total: 120, color: "#f59e0b" },
    { name: "HR",       solved: 0, total: 60,  color: "#ef4444" }
  ]}
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);