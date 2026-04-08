const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    company:      { type: String, required: true },
    questionText: { type: String, required: true },
    category:     { type: String },
    round:        { type: String },
    difficulty:   { type: String, enum: ["Easy", "Medium", "Hard"] },
    frequency:    { type: Number, default: 1 },
    approach:     { type: String },
    leetcode:     { type: String, default: "" },   // ← ADD
    addedBy:      { type: Schema.Types.ObjectId, ref: "User" },
    createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model("Question", questionSchema);