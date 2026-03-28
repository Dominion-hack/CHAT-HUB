function sendMessage(){
  const msg = document.getElementById("msg").value;
  const box = document.getElementById("chat-box");
  const p = document.createElement("p");
  p.textContent = localStorage.getItem("username") + ": " + msg;
  box.appendChild(p);
  document.getElementById("msg").value = "";
}
