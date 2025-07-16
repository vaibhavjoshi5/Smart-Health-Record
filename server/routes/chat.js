const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/chat directory exists
const uploadDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Get chat history for a room
router.get('/:room', async (req, res) => {
  try {
    const messages = await Chat.find({ room: req.params.room }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

// File upload endpoint
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ fileUrl: `/uploads/chat/${req.file.filename}`, fileName: req.file.originalname });
});

module.exports = router; 