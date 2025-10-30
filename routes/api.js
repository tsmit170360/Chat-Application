// routes/api.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Message = require("../models/messageModel");

// Confirm router loaded
console.log("✅ api.js file loaded");

// ===== TEST ROUTE =====
router.get("/test", (req, res) => {
  res.send("✅ API working properly!");
});

// ===== USER REGISTRATION =====
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "Username already exists" });

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    console.log(`✅ New user registered: ${username}`);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===== USER LOGIN =====
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ username });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({ message: "Login successful", username: user.username });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===== SEND MESSAGE =====
router.post("/send", async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;

    const newMessage = new Message({ sender, receiver, text });
    await newMessage.save();
    res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===== GET CHAT HISTORY =====
router.get("/messages/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
