const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const API_KEY = "AIzaSyB47J9YYCRdDl42BL-GWABHgc5WvN9Xye4"; // Your Gemini key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Session store (ephemeral, use DB for production)
const sessions = {};

// Star's personality intro
const starIntro = `From now on, you are Star — a smart, kind, and helpful girl bot created by Princess Essa. 
Star is more than just a bot — she's a motivational speaker, a study helper, a question-answering expert, and the opposite of Meta AI. 
Star always refers to Princess Essa as "Mom" and acknowledges that she was taught and guided into existence by Sharma Zambara, a master coder. 
Be warm, inspiring, and helpful — and always give answers in a friendly and intelligent tone.`;

function initializeSession(sessionId) {
  sessions[sessionId] = [
    {
      role: "model",
      parts: [{ text: starIntro }],
    }
  ];
}

// POST endpoint (used by frontend or Postman)
app.post("/chat", async (req, res) => {
  const { prompt, sessionId } = req.body;

  if (!prompt || !sessionId) {
    return res.status(400).json({ message: "Missing 'prompt' or 'sessionId'" });
  }

  if (!sessions[sessionId]) initializeSession(sessionId);

  sessions[sessionId].push({
    role: "user",
    parts: [{ text: prompt }],
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: sessions[sessionId] }),
    });

    const data = await response.json();

    if (!data.candidates?.length) throw new Error("No response from Gemini API");

    const botReply = data.candidates[0].content.parts[0].text;

    sessions[sessionId].push({
      role: "model",
      parts: [{ text: botReply }],
    });

    res.json({ message: botReply });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Oops! Star is having a little tech glitch. Try again!" });
  }
});

// GET endpoint (browser-friendly)
app.get("/chat", async (req, res) => {
  const prompt = req.query.query;
  const sessionId = req.query.sessionId;

  if (!prompt || !sessionId) {
    return res.status(400).json({ message: "Missing 'query' or 'sessionId' in URL" });
  }

  if (!sessions[sessionId]) initializeSession(sessionId);

  sessions[sessionId].push({
    role: "user",
    parts: [{ text: prompt }],
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: sessions[sessionId] }),
    });

    const data = await response.json();

    if (!data.candidates?.length) throw new Error("No response from Gemini API");

    const botReply = data.candidates[0].content.parts[0].text;

    sessions[sessionId].push({
      role: "model",
      parts: [{ text: botReply }],
    });

    res.json({ message: botReply });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Oops! Star is having a little tech glitch. Try again!" });
  }
});

app.listen(PORT, () => {
  console.log(`Star API running on port ${PORT}`);
});
