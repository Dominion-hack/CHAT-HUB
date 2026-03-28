import bcrypt from 'bcryptjs';

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const db = env.CHATDB; // Cloudflare D1 database binding

    // SIGNUP
    if (req.method === "POST" && url.pathname === "/signup") {
      const { email, username, password } = await req.json();
      const hash = await bcrypt.hash(password, 10);
      await db.prepare("INSERT INTO users (email, username, password) VALUES (?, ?, ?)").bind(email, username, hash).run();
      return new Response("User created");
    }

    // LOGIN
    if (req.method === "POST" && url.pathname === "/login") {
      const { email, password } = await req.json();
      const user = await db.prepare("SELECT * FROM users WHERE email=?").bind(email).first();
      if (!user) return new Response("User not found");
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return new Response("Wrong password");
      return new Response(JSON.stringify({ username: user.username }));
    }

    // SEARCH USERS
    if (req.method === "GET" && url.pathname.startsWith("/users/")) {
      const name = decodeURIComponent(url.pathname.split("/")[2]);
      const users = await db.prepare("SELECT username FROM users WHERE username LIKE ?").bind(`%${name}%`).all();
      return new Response(JSON.stringify(users.results.map(u => u.username)));
    }

    // LOAD MESSAGES
    if (req.method === "GET" && url.pathname.startsWith("/messages/")) {
      const [_, user1, user2] = url.pathname.split("/");
      const msgs = await db.prepare(
        "SELECT sender, receiver, text FROM messages WHERE (sender=? AND receiver=?) OR (sender=? AND receiver=?) ORDER BY id"
      ).bind(user1,user2,user2,user1).all();
      return new Response(JSON.stringify(msgs.results));
    }

    // SEND MESSAGE
    if (req.method === "POST" && url.pathname === "/send") {
      const { sender, receiver, text } = await req.json();
      await db.prepare("INSERT INTO messages (sender, receiver, text) VALUES (?, ?, ?)").bind(sender, receiver, text).run();
      return new Response("Message sent");
    }

    return new Response("Not Found", { status: 404 });
  }
};
