// server.js
import "dotenv/config";
import express from "express";

const app = express();
app.use(express.static("public"));
app.use(express.text({ type: ["application/sdp", "text/plain"] }));

// Config de sesión Realtime (modelo + voz)
const sessionConfig = JSON.stringify({
  type: "realtime",
  model: "gpt-realtime",
  audio: { output: { voice: "marin" } }, // prueba también "cedar"
});

app.post("/session", async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).send("Falta OPENAI_API_KEY en .env");
  }

  const fd = new FormData();
  fd.set("sdp", req.body);
  fd.set("session", sessionConfig);

  const r = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: fd,
  });

  const text = await r.text();
  if (!r.ok) return res.status(r.status).send(text);

  res.type("application/sdp").send(text);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OK -> http://localhost:${PORT}`);
});
