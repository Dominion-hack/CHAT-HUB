const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

app.use(express.static("public"));

let onlineUsers = {};

io.on("connection", socket => {

    console.log("User connected");

    socket.on("join", user => {
        onlineUsers[socket.id] = user;
        io.emit("onlineUsers", Object.values(onlineUsers));
    });

    socket.on("message", data => {

        // SIMPLE MODERATION
        const bannedWords = ["spam","scam","hack"];

        const detected = bannedWords.some(word =>
            data.text.toLowerCase().includes(word)
        );

        if(detected){
            socket.emit("warning", {
                msg:"⚠ Message blocked by moderation"
            });
            return;
        }

        io.emit("message", data);

    });

    socket.on("disconnect", () => {
        delete onlineUsers[socket.id];
        io.emit("onlineUsers", Object.values(onlineUsers));
    });

});

server.listen(3000, () => {
    console.log("EMMZYAPP running on port 3000");
});