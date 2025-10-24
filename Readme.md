One-to-One Chat App — From Scratch
🧱 Stack

Frontend: HTML, CSS, JavaScript

Backend: Node.js + Express

Realtime: Socket.io

Database: MongoDB (for storing users & messages)

API: REST APIs for login, fetching chat history, etc.


🗂️ Folder Structure
chat Application/
│
├── server.js                # Entry point (Express + Socket.io)
├── package.json
├── public/
│   ├── index.html           # Login page
│   ├── chat.html            # Chat interface
│   ├── style.css
│   └── script.js
├── models/
│   ├── userModel.js
│   └── messageModel.js
├── routes/
│   └── api.js
└── .env                     # MongoDB URI and other secrets