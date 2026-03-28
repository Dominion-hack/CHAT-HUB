const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);

// DATABASE
mongoose.connect("mongodb://127.0.0.1:27017/chatDB");

// MODELS
const User = mongoose.model("User", {
  email: String,
  password: String,
  username: String,
});

const Message = mongoose.model("Message", {
  sender: String,
  receiver: String,
  text: String,
});

// ================= AUTH =================

// SIGNUP
app.post("/signup", async (req, res) => {
  const { email, password, username } = req.body;

  const hash = await bcrypt.hash(password, 10);

  await User.create({ email, password: hash, username });

  res.send("User created");
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.send("User not found");

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.send("Wrong password");

  res.json({ username: user.username });
});

// SEARCH USERS
app.get("/users/:name", async (req, res) => {
  const users = await User.find({
    username: { $regex: req.params.name, $options: "i" }
  });
  res.json(users);
});

// LOAD CHAT HISTORY
app.get("/messages/:user1/:user2", async (req, res) => {
  const msgs = await Message.find({
    $or: [
      { sender: req.params.user1, receiver: req.params.user2 },
      { sender: req.params.user2, receiver: req.params.user1 }
    ]
  });

  res.json(msgs);
});

// ================= SOCKET =================

let onlineUsers = {};

io.on("connection", (socket) => {

  socket.on("join", (username) => {
    onlineUsers[username] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  socket.on("privateMessage", async (data) => {
    await Message.create(data);

    io.to(onlineUsers[data.receiver]).emit("receiveMessage", data);
    io.to(onlineUsers[data.sender]).emit("receiveMessage", data);
  });

  socket.on("typing", (data) => {
    io.to(onlineUsers[data.to]).emit("typing", data.from);
  });

  socket.on("disconnect", () => {
    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });
});

server.listen(3000, () => console.log("Running on 3000"));
