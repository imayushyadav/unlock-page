const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

const BOT_TOKEN = process.env.BOT_TOKEN;
const PRIVATE_CHANNEL_ID = Number(process.env.PRIVATE_CHANNEL_ID);
const WEB_SECRET = process.env.WEB_SECRET;

/* ADS PAGE */
app.get('/ads/video', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/ads/shortlink', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});

/* 🔥 FINAL UNLOCK */
app.post('/unlock/send', async (req, res) => {
  const { uid, fid } = req.body;

  if (!uid || !fid) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/copyMessage`,
      {
        chat_id: uid,
        from_chat_id: PRIVATE_CHANNEL_ID,
        message_id: fid   // ⚠️ fid MUST be message_id
      }
    );

    res.json({ success: true });
  } catch (e) {
    console.error('Telegram error:', e.response?.data);
    res.status(500).json({ error: 'Telegram failed' });
  }
});

app.get('/', (_, res) => res.send('Unlock server alive'));

app.listen(process.env.PORT || 3000);
