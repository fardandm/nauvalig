const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==================== TOKEN ====================
const TOKEN = "MTUxMTM5MDQ1NzU0MjczODA2MA.Gzlyyl.1coTKLXGV4oyCHWtqA8I58cA7oG0nLsE4_p2RQ";

if (!TOKEN || TOKEN.length < 50) {
  console.error("[danzzz] TOKEN BELUM DIISI!");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages]
});

// Anti Crash Global
process.on('unhandledRejection', (reason) => {
  console.log('[danzzz] Unhandled Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.log('[danzzz] Uncaught Exception:', err.message);
});

// Bot Events
client.on('ready', () => {
  console.log(`[danzzz] Bot ONLINE → ${client.user.tag}`);
});

client.on('error', (err) => {
  console.error(`[danzzz] Client Error: ${err.message}`);
});

client.on('disconnect', () => {
  console.log(`[danzzz] Bot Disconnect - mencoba reconnect...`);
});

client.on('reconnecting', () => {
  console.log(`[danzzz] Reconnecting...`);
});

// Login dengan auto retry
const loginBot = () => {
  client.login(TOKEN).catch(err => {
    console.error(`[danzzz] Login gagal: ${err.message}`);
    setTimeout(loginBot, 10000); // retry 10 detik
  });
};

loginBot();

// ==================== API ====================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: "ok", 
    bot: client.isReady() ? client.user.tag : "offline",
    uptime: Math.floor(process.uptime()) + "s"
  });
});

app.get('/api/status', (req, res) => {
  res.json({ running: false, botOnline: client.isReady() });
});

app.post('/api/spam', async (req, res) => {
  const { targetId, message, count = 50, delay = 800 } = req.body;

  if (!targetId || !message) {
    return res.status(400).json({ error: "targetId dan message wajib" });
  }

  let sent = 0;
  const total = Math.min(parseInt(count), 150);
  const delayMs = parseInt(delay);

  console.log(`[danzzz] Mulai spam → ${targetId} | Total: ${total}`);

  const interval = setInterval(async () => {
    if (sent >= total) {
      clearInterval(interval);
      console.log(`[danzzz] Spam selesai ke ${targetId}`);
      return;
    }

    try {
      const user = await client.users.fetch(targetId);
      await user.send(message);
      sent++;
      console.log(`[danzzz] Terkirim \( {sent}/ \){total}`);
    } catch (err) {
      console.log(`[danzzz] Error kirim: ${err.message}`);
    }
  }, delayMs);

  res.json({ status: "success", target: targetId, total });
});

app.post('/api/stop', (req, res) => {
  res.json({ status: "stopped" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[danzzz] Server aktif di port ${PORT}`);
});
