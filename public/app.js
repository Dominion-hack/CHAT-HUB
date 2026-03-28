const WORKER_URL = "https://YOUR_WORKER_URL"; // replace with your Worker URL
const username = localStorage.getItem("username");
let currentChatUser = "";

const usersList = document.getElementById("users");
const chatWith = document.getElementById("chatWith");
const messages = document.getElementById("messages");
const msg = document.getElementById("msg");

async function search(){
  const res = await fetch(`${WORKER_URL}/users/${searchUser.value}`);
  const users = await res.json();
  usersList.innerHTML="";
  users.forEach(u=>{
    const li = document.createElement("li");
    li.textContent = u;
    li.onclick = async ()=>{
      currentChatUser = u;
      chatWith.textContent = "Chat with "+u;
      const res2 = await fetch(`${WORKER_URL}/messages/${username}/${u}`);
      const msgs = await res2.json();
      messages.innerHTML="";
      msgs.forEach(m=>{
        const li2=document.createElement("li");
        li2.textContent = m.sender+": "+m.text;
        messages.appendChild(li2);
      });
    };
    usersList.appendChild(li);
  });
}

async function send(){
  if(!currentChatUser) return alert("Select a user first!");
  await fetch(`${WORKER_URL}/send`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sender:username,receiver:currentChatUser,text:msg.value})
  });
  msg.value="";
  search(); // refresh messages
}
