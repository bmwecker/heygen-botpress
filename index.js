const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { StreamingAvatar, TaskType } = require("@heygen/streaming-avatar");

dotenv.config(); // Загружаем переменные из .env

const app = express();
app.use(cors());
app.use(express.json());

const avatar = new StreamingAvatar({ token: process.env.HEYGEN_ACCESS_TOKEN });

let sessionData = null;

//1️⃣ Создаём сессию в HeyGen
const startSession = async () => {
  sessionData = await avatar.createStartAvatar({
    avatarName: "DoctorAI",
    quality: "high",
    disableIdleTimeout: true,
  });

  console.log("🎬 Сессия HeyGen запущена:", sessionData.session_id);
};

// 2️⃣ Отправляем текст в Botpress
const sendToBotpress = async (text) => {
  const response = await fetch(process.env.BOTPRESS_SERVER + "/api/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });

  const botData = await response.json();
  return botData.reply;
};

// 3️⃣ API для общения с аватаром
app.post("/chat", async (req, res) => {
  const { text } = req.body;
  console.log("🗣 Пользователь сказал:", text);

  if (!sessionData) {
    await startSession();
  }

  const botpressReply = await sendToBotpress(text);
  console.log("🤖 Botpress ответил:", botpressReply);

  await avatar.speak({
    sessionId: sessionData.session_id,
    text: botpressReply,
    task_type: TaskType.REPEAT,
  });

  res.json({ reply: botpressReply });
});

// 4️⃣ Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
