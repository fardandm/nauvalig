const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const TOKEN = process.env.DISCORD_TOKEN;
const DEFAULT_DELAY = parseInt(process.env.DEFAULT_DELAY) || 750;
const MAX_MESSAGES = parseInt(process.env.MAX_MESSAGES) || 150;

if (!TOKEN) {
  console.error("[DANZZZ] DISCORD_TOKEN environment variable belum di-set");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
});

let isRunning = false;
let currentSpam = null;

client.on('ready', () => {
  console.log(`[DANZZZ] Bot berhasil login sebagai ${client.user.tag}`);
});

client.login(TOKEN);

// ==================== API ROUTES ====================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: "operational",
    bot: client.user ? client.user.tag : "connecting",
    timestamp: new Date().toISOString()
  });
});

// Status Spam
app.get('/api/status', (req, res) => {
  res.json({
    running: isRunning,
    botOnline: client.isReady(),
    currentSpam: currentSpam
  });
});

// Main Spam Endpoint
app.post('/api/spam', async (req, res) => {
  const { targetId, message, count, delay } = req.body;

  if (!targetId || !message) {
    return res.status(400).json({ error: "targetId dan message wajib diisi" });
  }

  if (isRunning) {
    return res.status(409).json({ error: "Spam sedang aktif. Tunggu selesai atau restart service." });
  }

  isRunning = true;
  currentSpam = {
    targetId,
    total: Math.min(parseInt(count) || MAX_MESSAGES, 300),
    sent: 0,
    delay: parseInt(delay) || DEFAULT_DELAY
  };

  let sentCount = 0;

  const spamInterval = setInterval(async () => {
    if (sentCount >= currentSpam.total) {
      clearInterval(spamInterval);
      isRunning = false;
      currentSpam = null;
      console.log(`[DANZZZ] Spam selesai ke ${targetId}`);
      return;
    }

    try {
      const user = await client.users.fetch(targetId);
      await user.send(message);
      sentCount++;
      currentSpam.sent = sentCount;
      console.log(`[DANZZZ] Terkirim \( {sentCount}/ \){currentSpam.total} → ${targetId}`);
    } catch (err) {
      console.log(`[DANZZZ] Error mengirim ke ${targetId}: ${err.message}`);
    }
  }, currentSpam.delay);

  res.json({
    status: "success",
    message: "Spam PM Discord dimulai",
    targetId: targetId,
    totalMessages: currentSpam.total,
    delayMs: currentSpam.delay,
    note: "Jangan tutup service Railway selama proses berjalan"
  });
});

// Stop Spam
app.post('/api/stop', (req, res) => {
  isRunning = false;
  if (currentSpam) currentSpam = null;
  res.json({ status: "stopped", message: "Spam dihentikan manual" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[DANZZZ] API Server berjalan di port ${PORT}`);
});