const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const GameServer = require('./game-server');

// Create Express app
const app = express();
const server = http.createServer(app);

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Set up Socket.IO with CORS enabled
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Initialize game server
const gameServer = new GameServer(io);

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Get port from environment or use 3000
const PORT = process.env.PORT || 3000;

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the game at http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
