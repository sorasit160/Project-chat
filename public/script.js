const socket = io();

const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const chatContainer = document.querySelector('.chat-container');

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const messagesArea = document.getElementById('chat-messages');
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');
const typingIndicator = document.getElementById('typing-indicator');

const emojis = ['😀', '😂', '😍', '🤔', '😎', '🙌', '👍', '🔥', '✨', '❤️', '🎉', '🚀', '🌈', '🍕', '💻', '💡', '✅', '❌'];

// Initialize Emojis
emojis.forEach(emoji => {
    const span = document.createElement('span');
    span.textContent = emoji;
    span.addEventListener('click', () => {
        messageInput.value += emoji;
        emojiPicker.classList.remove('active');
        messageInput.focus();
        handleTyping(); // Trigger typing status when emoji added
    });
    emojiPicker.appendChild(span);
});

// Toggle Emoji Picker
emojiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiPicker.classList.toggle('active');
});

// Close picker when clicking outside
document.addEventListener('click', () => {
    emojiPicker.classList.remove('active');
});

let currentUser = {
    id: Math.random().toString(36).substring(2, 9),
    name: ''
};

let typingTimeout;

function handleTyping() {
    socket.emit('typing', currentUser.name);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop typing');
    }, 2000);
}

messageInput.addEventListener('input', handleTyping);

// Login Logic
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (usernameInput.value.trim()) {
        currentUser.name = usernameInput.value.trim();
        loginOverlay.style.display = 'none';
        chatContainer.classList.add('active');
        
        // Notify server that a user joined
        socket.emit('user joined', currentUser.name);
    }
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (messageInput.value) {
        const messageData = {
            id: currentUser.id,
            name: currentUser.name,
            text: messageInput.value,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        socket.emit('chat message', messageData);
        messageInput.value = '';
        socket.emit('stop typing');
    }
});

function renderMessage(msg) {
    const item = document.createElement('div');
    item.classList.add('message');
    
    if (msg.id === currentUser.id) {
        item.classList.add('user');
    } else {
        item.classList.add('other');
    }

    const nameHtml = msg.id !== currentUser.id ? `<span class="sender-name">${msg.name}</span>` : '';

    item.innerHTML = `
        ${nameHtml}
        <div class="msg-text">${msg.text}</div>
        <div class="msg-time" style="font-size: 0.75rem; opacity: 0.7; margin-top: 4px; text-align: right;">${msg.timestamp}</div>
    `;
    
    messagesArea.appendChild(item);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

socket.on('chat history', (history) => {
    history.forEach(msg => renderMessage(msg));
});

socket.on('chat message', (msg) => {
    renderMessage(msg);
});

socket.on('user joined', (name) => {
    const item = document.createElement('div');
    item.classList.add('message', 'system');
    item.textContent = `${name} joined the chat`;
    messagesArea.appendChild(item);
    messagesArea.scrollTop = messagesArea.scrollHeight;
});

socket.on('typing', (name) => {
    typingIndicator.textContent = `${name} is typing...`;
    typingIndicator.classList.add('active');
});

socket.on('stop typing', () => {
    typingIndicator.classList.remove('active');
});
