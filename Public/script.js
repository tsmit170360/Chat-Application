const socket = io();
const username = localStorage.getItem("username");
document.getElementById("user").textContent = `Logged in as: ${username}`;
socket.emit("register", username);

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("message");
const receiverInput = document.getElementById("receiver");
const chatBox = document.getElementById("chat-box");

sendBtn.addEventListener("click", () => {
  const message = messageInput.value;
  const receiver = receiverInput.value;

  if (message && receiver) {
    socket.emit("private_message", { sender: username, receiver, message });
    addMessage(`You: ${message}`);
    messageInput.value = "";
  }
});

socket.on("private_message", ({ sender, message }) => {
  addMessage(`${sender}: ${message}`);
});

function addMessage(msg) {
  const p = document.createElement("p");
  p.textContent = msg;
  chatBox.appendChild(p);
}
