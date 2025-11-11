import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';

let socket; // We keep socket in the global scope

export default function Chat() {
  const [username, setUsername] = useState('');
  const [recipient, setRecipient] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null); // Ref to auto-scroll

  const router = useRouter();

  // Function to auto-scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to initialize socket connection
  useEffect(() => {
    // Get username from URL query param
    if (router.query.username) {
      setUsername(router.query.username);

      // Initialize socket connection
      // We run fetch('/api/socket') first to "wake up" the serverless function
      fetch('/api/socket');
      socket = io();

      // Register the user with the socket server
      socket.emit('register_user', router.query.username);

      // Set up listener for incoming messages
      socket.on('receive_message', (message) => {
        // Update messages state, but only if it's from the current recipient
        // We'll update this logic slightly in a moment
        setMessages((prevMessages) => [...prevMessages, message]);
      });
    }

    // Disconnect socket on component unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [router.query.username]);

  // Effect to fetch chat history when recipient changes
  useEffect(() => {
    if (username && recipient) {
      fetch(`/api/messages?user1=${username}&user2=${recipient}`)
        .then((res) => res.json())
        .then((history) => {
          setMessages(history);
        });
    }
  }, [recipient, username]); // Runs when recipient or username changes

  // Effect to auto-scroll when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !recipient) return;

    const message = {
      sender: username,
      receiver: recipient,
      text: newMessage,
    };

    // Emit message to the server
    socket.emit('send_message', message);

    // Add message to our own chat window immediately
    setMessages((prevMessages) => [...prevMessages, message]);
    setNewMessage(''); // Clear input
  };

  // We'll filter messages to only show those for the selected recipient
  const filteredMessages = messages.filter(
    (msg) =>
      (msg.sender === username && msg.receiver === recipient) ||
      (msg.sender === recipient && msg.receiver === username)
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white p-4 shadow-md text-gray-800">
        <h1 className="text-xl font-bold text-center">
          Chatting as: {username}
        </h1>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (for setting recipient) */}
        <div className="w-1/3 p-4 bg-gray-200 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Chat with:
          </h2>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient's username"
            className="w-full px-3 py-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Window */}
          <div className="flex-1 p-4 overflow-y-auto bg-white">
            {recipient ? (
              filteredMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 p-3 rounded-lg max-w-xs ${
                    msg.sender === username
                      ? 'ml-auto bg-blue-500 text-white' // Sent by me
                      : 'mr-auto bg-gray-300 text-gray-800' // Received
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 mt-10">
                Please enter a recipient's username to start chatting.
              </div>
            )}
            {/* Empty div to mark the end for auto-scrolling */}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="flex p-4 bg-gray-200 border-t"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-l-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!recipient} // Disable if no recipient
            />
            <button
              type="submit"
              className="px-6 py-2 font-semibold text-white bg-blue-500 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              disabled={!recipient} // Disable if no recipient
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}