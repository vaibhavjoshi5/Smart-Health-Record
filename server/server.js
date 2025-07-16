// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { router: authRouter, authMiddleware } = require('./routes/auth');
const { router: medicalRecordsRouter } = require('./routes/medicalRecords');
const { router: doctorRouter } = require('./routes/doctor');
const { router: patientRouter } = require('./routes/patient');
const { router: profileRouter } = require('./routes/profile');
const { router: appointmentRouter } = require('./routes/appointment');
const { router: aiRouter } = require('./routes/ai');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const chatRoutes = require('./routes/chat');
const Chat = require('./models/Chat');

dotenv.config(); // load .env variables

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.use(cors());
app.use(express.json());

// Dummy route to test
app.get("/", (req, res) => {
  res.send("Smart Health Record Backend is running ✅");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Serve chat uploads statically
app.use('/uploads/chat', express.static('uploads/chat'));
app.use('/api/chat', chatRoutes);

app.use('/api/auth', authRouter);
app.use('/api/medical-records', medicalRecordsRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/patient', patientRouter);
app.use('/api/profile', profileRouter);
app.use('/api/appointment', appointmentRouter);
app.use('/api/ai', aiRouter);

// Socket.io logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a room for doctor-patient chat
  socket.on('joinRoom', (room) => {
    socket.join(room);
  });

  // Listen for new messages
  socket.on('chatMessage', async (data) => {
    // data: { room, sender, message }
    const chatMsg = new Chat({ room: data.room, sender: data.sender, message: data.message });
    await chatMsg.save();
    io.to(data.room).emit('chatMessage', chatMsg);
  });

  // Listen for file messages
  socket.on('fileMessage', async (data) => {
    // data: { room, sender, fileUrl, fileName }
    const fileMsg = new Chat({ room: data.room, sender: data.sender, fileUrl: data.fileUrl, fileName: data.fileName });
    await fileMsg.save();
    io.to(data.room).emit('fileMessage', fileMsg);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
