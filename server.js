const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Helper to load messages
function loadMessages() {
    if (fs.existsSync(MESSAGES_FILE)) {
        return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    }
    return [];
}

// Helper to save messages
function saveMessage(msg) {
    const messages = loadMessages();
    messages.push(msg);
    // Keep only last 100 messages for simplicity
    if (messages.length > 100) messages.shift();
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Handle Socket.io connections
io.on('connection', (socket) => {
    // We'll log the full name once they join
    let currentUsername = 'Anonymous';

    // Send history to the new user
    socket.emit('chat history', loadMessages());

    // Handle user joining
    socket.on('user joined', (username) => {
        currentUsername = username;
        console.log(`User joined: ${username}`);
        socket.broadcast.emit('user joined', username);
    });

    // Handle typing events
    socket.on('typing', (username) => {
        socket.broadcast.emit('typing', username);
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing');
    });

    // Handle chat messages
    socket.on('chat message', (msg) => {
        console.log(`Message from ${msg.name}: ${msg.text}`);
        saveMessage(msg);
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${currentUsername}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
