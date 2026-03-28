const socket = io();
const username = localStorage.getItem("username");

let currentChatUser = "";

socket.emit("join", username);

// SEARCH
async function search(){
  const res = await fetch("/users/"+searchUser.value);
  const users = await res.json();

  usersList.innerHTML="";

  users.forEach(u=>{
    const li=document.createElement("li");
    li.textContent=u.username;

    li.onclick=async ()=>{
      currentChatUser=u.username;
      chatWith.textContent="Chat with "+u.username;

      const res=await fetch(`/messages/${username}/${u.username}`);
      const msgs=await res.json();

      messages.innerHTML="";
      msgs.forEach(m=>{
        const li=document.createElement("li");
        li.textContent=m.sender+": "+m.text;
        messages.appendChild(li);
      });
    };

    usersList.appendChild(li);
  });
}

// SEND
function send(){
  socket.emit("privateMessage",{
    sender:username,
    receiver:currentChatUser,
    text:msg.value
  });

  msg.value="";
}

// RECEIVE
socket.on("receiveMessage",(data)=>{
  if(data.sender===currentChatUser || data.receiver===currentChatUser){
    const li=document.createElement("li");
    li.textContent=data.sender+": "+data.text;
    messages.appendChild(li);
  }
});

// ONLINE USERS
socket.on("onlineUsers",(users)=>{
  console.log("Online:",users);
});

// TYPING
msg.addEventListener("input",()=>{
  socket.emit("typing",{from:username,to:currentChatUser});
});

socket.on("typing",(user)=>{
  typing.textContent=user+" is typing...";
  setTimeout(()=>typing.textContent="",1000);
});
