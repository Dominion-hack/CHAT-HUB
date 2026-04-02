const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const USERS_FILE = "./data/users.json";
const MESSAGES_FILE = "./data/messages.json";

// Init JSON files
fs.ensureFileSync(USERS_FILE);
fs.ensureFileSync(MESSAGES_FILE);

if (!fs.readJsonSync(USERS_FILE, { throws: false })) fs.writeJsonSync(USERS_FILE, []);
if (!fs.readJsonSync(MESSAGES_FILE, { throws: false })) fs.writeJsonSync(MESSAGES_FILE, []);

// Signup
app.post("/signup", async (req, res) => {
  const users = fs.readJsonSync(USERS_FILE);
  const { email, username, password } = req.body;

  if (users.find(u => u.email === email)) return res.status(400).json({ error: "Email exists" });

  users.push({ email, username, password, banned: false, premium: false });
  fs.writeJsonSync(USERS_FILE, users);
  res.json({ success: true, username });
});

// Login
app.post("/login", (req, res) => {
  const users = fs.readJsonSync(USERS_FILE);
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  if (user.banned) return res.status(403).json({ error: "You are banned" });

  res.json({ username: user.username, premium: user.premium });
});

// Admin ban/unban
app.post("/admin/ban", (req, res) => {
  const { email } = req.body;
  const users = fs.readJsonSync(USERS_FILE);
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: "User not found" });
  user.banned = true;
  fs.writeJsonSync(USERS_FILE, users);
  res.json({ success: true });
});

app.post("/admin/unban", (req, res) => {
  const { email } = req.body;
  const users = fs.readJsonSync(USERS_FILE);
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: "User not found" });
  user.banned = false;
  fs.writeJsonSync(USERS_FILE, users);
  res.json({ success: true });
});

// Socket.io chat
io.on("connection", socket => {
  console.log("User connected");

  // Load previous messages
  const messages = fs.readJsonSync(MESSAGES_FILE);
  socket.emit("chat-history", messages);

  socket.on("send-message", msg => {
    const messages = fs.readJsonSync(MESSAGES_FILE);
    messages.push(msg);
    fs.writeJsonSync(MESSAGES_FILE, messages);
    io.emit("chat-message", msg);
  });

  socket.on("disconnect", () => console.log("User disconnected"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Chat Hub server running on port ${PORT}`));