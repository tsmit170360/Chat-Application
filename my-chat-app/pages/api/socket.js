import { Server } from 'socket.io';
import dbConnect from '../../lib/dbConnect';
import Message from '../../models/Message';

// This object will store the mapping of usernames to socket IDs 
const users = {}; 

export default function SocketHandler(req, res) {
  // It's important to check if the server is already running
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Starting Socket.io server...');
  // Create a new Socket.io server and attach it to the Next.js web server
  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  // This runs when a new user connects
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 1. Handle user registration
    socket.on('register_user', (username) => {
      users[username] = socket.id;
      console.log(`Registered: ${username} -> ${socket.id}`);
    }); // 

    // 2. Handle sending private messages
socket.on('send_message', async (message) => {
  const { sender, receiver, text } = message;
  console.log(`Message from ${sender} to ${receiver}: ${text}`);

  // Step 1: Store the message in MongoDB
  try {
    await dbConnect(); // Make sure we are connected
    await Message.create({ sender, receiver, text, timestamp: new Date() });
    console.log('Message saved to DB successfully.'); // <-- ADDED THIS
  } catch (error) {
    console.error('!!! ERROR saving message to DB:', error);
  }

  // Step 2: Send the message to the receiver if they are online
  const receiverSocketId = users[receiver];
  if (receiverSocketId) {
    // FIX: Send the FULL message object, not just sender/text
    io.to(receiverSocketId).emit('receive_message', message);
  }
});

    // 3. Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // Find and remove the user from our 'users' object
      for (const username in users) {
        if (users[username] === socket.id) {
          delete users[username];
          console.log(`Unregistered: ${username}`);
          break;
        }
      }
    });
  });

  res.end();
}