const mongoose = require('mongoose');
const chatSchema = new mongoose.Schema({
  room: String,
  sender: String,
  message: String,
  fileUrl: String,
  fileName: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Chat', chatSchema); 