const express = require('express');
const crypto = require('crypto');
const path = require('path');
const axios = require('axios');

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// ENV variables (Render se aayenge)
const SECRET = process.env.WEB_SECRET;
if (!SECRET) {
  console.error("❌ WEB_SECRET missing");
}
const BOT_TOKEN = process.env.BOT_TOKEN;
const PRIVATE_CHANNEL_ID = process.env.PRIVATE_CHANNEL_ID;

// 1️⃣ UI SERVE ONLY (NO VALIDATION HERE)
app.get('/unlock', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 2️⃣ REAL VALIDATION + FILE SEND
app.post('/unlock/send', async (req, res) => {
  const { uid, fid, ts, sig } = req.body;

  if (!uid || !fid || !ts || !sig) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  // link expiry (5 min)
  if (Date.now() - Number(ts) > 5 * 60 * 1000) {
    return res.status(403).json({ error: 'Link expired' });
  }

  // signature check
  const checkSig = crypto
    .createHmac('sha256', SECRET)
    .update(`${uid}:${fid}:${ts}`)
    .digest('hex');

  if (checkSig !== sig) {
    return res.status(403).json({ error: 'Bad signature' });
  }

  try {
    // Send file/message via Telegram
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/copyMessage`,
      {
        chat_id: uid,
        from_chat_id: PRIVATE_CHANNEL_ID,
        message_id: fid
      }
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Telegram error' });
  }
});

// PORT (Render auto)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
