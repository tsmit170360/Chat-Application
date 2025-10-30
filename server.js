// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const apiRoutes = require("./routes/api");
const Message = require("./models/messageModel"); // ✅ Import Message model

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.static("Public"));

// ===== Serve static frontend =====
app.use(express.static(path.join(__dirname, "Public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Public", "index.html"));
});

// ===== Connect MongoDB =====
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// ===== Test Route =====
app.get("/test", (req, res) => {
  res.send("✅ API working properly!");
});

// ===== Use Routes =====
app.use("/api", apiRoutes);

// ===== Socket.io setup =====
const users = {}; // username -> socket.id mapping

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Register username
  socket.on("register", (username) => {
    users[username] = socket.id;
    console.log(`🟢 ${username} registered as ${socket.id}`);
  });

  // ✅ Handle private messages + save to DB
  socket.on("private_message", async ({ sender, receiver, message }) => {
    console.log(`📩 ${sender} → ${receiver}: ${message}`);

    try {
      // Save message to MongoDB
      const newMessage = new Message({ sender, receiver, text: message });
      await newMessage.save();

      // Send message to receiver if online
      const receiverSocketId = users[receiver];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("private_message", { sender, message });
      }
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  // ✅ Load chat history on request
  socket.on("get_history", async ({ user1, user2 }) => {
    try {
      const messages = await Message.find({
        $or: [
          { sender: user1, receiver: user2 },
          { sender: user2, receiver: user1 },
        ],
      }).sort({ timestamp: 1 });

      socket.emit("chat_history", messages);
    } catch (err) {
      console.error("❌ Error fetching chat history:", err);
    }
  });

  socket.on("disconnect", () => {
    for (const user in users) {
      if (users[user] === socket.id) delete users[user];
    }
    console.log("🔴 User disconnected:", socket.id);
  });
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Log available routes
  setTimeout(() => {
    if (!app._router || !app._router.stack) {
      console.log("⚠️ No routes detected (app._router not ready)");
      return;
    }

    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push(middleware.route.path);
      } else if (middleware.name === "router" && middleware.handle.stack) {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route && handler.route.path) {
            routes.push(`/api${handler.route.path}`);
          }
        });
      }
    });

    console.log("🧭 Available routes:", routes);
  }, 500);
});
