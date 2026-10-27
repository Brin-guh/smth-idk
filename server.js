const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Keep the most recent 100 messages in server memory.
const history = [];
const MAX_MESSAGES = 100;

app.get("/", (req, res) => {
    res.send("Shared Chat Server is running!");
});

io.on("connection", (socket) => {
    // Send existing messages to the new visitor.
    socket.emit("chat history", history);

    socket.on("chat message", (data) => {
        if (!data || typeof data.text !== "string") return;

        const text = data.text.trim();

        if (!text || text.length > 1000) return;

        // Generate the username on the server.
        // Do not trust usernames supplied by clients.
        const username = Array.from(
            { length: 10 },
            () => Math.floor(Math.random() * 10)
        ).join("");

        const message = {
            username,
            text,
            time: new Date().toLocaleTimeString()
        };

        history.push(message);

        if (history.length > MAX_MESSAGES) {
            history.shift();
        }

        // Broadcast the message to everyone connected.
        io.emit("chat message", message);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Chat server running on port ${PORT}`);
});