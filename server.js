const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==================== TOKEN ====================
const TOKEN = "MTM3MjkxMTg2Mzg3MTk2NzI0Mg.GpijQ9.0DrexohskABAo0O7y1Ke45sALEqmvpqNtFVk2w";

if (!TOKEN || TOKEN.length < 50) {
  console.error("[danzzz] TOKEN BELUM DIISI!");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages
  ]
});

let isRunning = false;

// ==================== ANTI CRASH HANDLER ====================
process.on('unhandledRejection', (reason, promise) => {
  console.log('[danzzz] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.log('[danzzz] Uncaught Exception:', err.message);
});

// Discord Event
client.on('ready', () => {
  console.log(`[danzzz] Bot ONLINE → ${client.user.tag}`);
});

client.on('error', (err) => {
  console.error(`[danzzz] Discord Error: ${err.message}`);
});

client.on('disconnect', () => {
  console.log(`[danzzz] Bot terputus, mencoba reconnect...`);
});

client.login(TOKEN).catch(err => {
  console.error(`[danzzz] Login gagal: ${err.message}`);
});

// ==================== API ====================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: "ok", 
    bot: client.isReady() ? client.user.tag : "offline",
    uptime: process.uptime()
  });
});

app.get('/api/status', (req, res) => {
  res.json({ running: isRunning, botOnline: client.isReady() });
});

app.post('/api/spam', async (req, res) => {
  const { targetId, message, count, delay } = req.body;

  if (!targetId || !message) {
    return res.status(400).json({ error: "targetId dan message wajib" });
  }

  if (isRunning) {
    return res.status(409).json({ error: "Spam sedang berjalan" });
  }

  isRunning = true;
  let sent = 0;
  const total = Math.min(parseInt(count) || 100, 200);
  const delayMs = parseInt(delay) || 800;

  console.log(`[danzzz] Memulai spam ke ${targetId} | Total: ${total}`);

  const interval = setInterval(async () => {
    if (sent >= total) {
      clearInterval(interval);
      isRunning = false;
      console.log(`[danzzz] Spam selesai ke ${targetId}`);
      return;
    }

    try {
      const user = await client.users.fetch(targetId);
      await user.send(message);
      sent++;
      console.log(`[danzzz] Terkirim \( {sent}/ \){total}`);
    } catch (err) {
      console.log(`[danzzz] Error: ${err.message}`);
    }
  }, delayMs);

  res.json({ status: "success", targetId, total, delay: delayMs });
});

app.post('/api/stop', (req, res) => {
  isRunning = false;
  res.json({ status: "stopped" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[danzzz] Server berjalan di port ${PORT}`);
});// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", bot: client.isReady() ? client.user.tag : "offline" });
});

app.get('/api/status', (req, res) => {
  res.json({ running: false, botOnline: client.isReady() });
});

app.post('/api/spam', (req, res) => {
  res.json({ error: "Fitur spam belum diaktifkan di versi minimal ini" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[danzzz] Server berjalan di port ${PORT}`);
});
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
