const socket = io();
const chat = document.getElementById("chat");

socket.on("chat-history", msgs => {
  chat.innerHTML = "";
  msgs.forEach(m => appendMessage(m));
});

socket.on("chat-message", m => appendMessage(m));

function appendMessage(m){
  const div = document.createElement("div");
  div.textContent = `${m.username}: ${m.text}`;
  chat.appendChild(div);
}

function send(){
  const msgInput = document.getElementById("msg");
  const username = localStorage.getItem("username") || "Anon";
  const text = msgInput.value;
  if(!text) return;
  socket.emit("send-message", {username, text});
  msgInput.value = "";
}