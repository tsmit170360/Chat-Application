const socket = io();
const username = localStorage.getItem("username");
document.getElementById("user").textContent = `Logged in as: ${username}`;
socket.emit("register", username);

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("message");
const receiverInput = document.getElementById("receiver");
const chatBox = document.getElementById("chat-box");

// 🧩 Load chat history when receiver is entered
receiverInput.addEventListener("change", () => {
  const receiver = receiverInput.value.trim();
  if (receiver) {
    chatBox.innerHTML = "";
    socket.emit("get_history", { user1: username, user2: receiver });
  }
});

// 🧠 Receive and show chat history
socket.on("chat_history", (messages) => {
  chatBox.innerHTML = "";
  messages.forEach((msg) => {
    const isSent = msg.sender === username;
    addMessage(`${msg.sender}: ${msg.text}`, isSent);
  });
});

// ✉️ Send message
sendBtn.addEventListener("click", () => {
  const message = messageInput.value.trim();
  const receiver = receiverInput.value.trim();

  if (!message || !receiver) return;

  socket.emit("private_message", { sender: username, receiver, message });
  addMessage(`You: ${message}`, true);
  messageInput.value = "";
});

// 💬 Receive real-time private messages
socket.on("private_message", ({ sender, message }) => {
  addMessage(`${sender}: ${message}`, false);
});

// 🧱 Helper to add messages to chat
function addMessage(msg, sent = false) {
  const p = document.createElement("p");
  p.textContent = msg;
  if (sent) p.classList.add("sent");
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}
