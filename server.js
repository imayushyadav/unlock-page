const express = require('express');
const crypto = require('crypto');
const path = require('path');
const axios = require('axios');

const app = express();

const SECRET = process.env.SECRET;


app.use(express.json());

/**
 * Validate unlock link & serve page
 */
app.get('/unlock', (req, res) => {

  const { uid, fid, ts, sig } = req.query;

  if (!uid || !fid || !ts || !sig) {
    return res.status(400).send('Invalid request');
  }

  // expire after 5 minutes
  if (Date.now() - Number(ts) > 5 * 60 * 1000) {
    return res.status(403).send('Link expired');
  }

  const check = crypto
    .createHash('sha256')
    .update(uid + fid + ts + SECRET)
    .digest('hex');

  if (check !== sig) {
    return res.status(403).send('Invalid signature');
  }

  res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * FINAL UNLOCK — send file
 */
app.post('/unlock/send', async (req, res) => {
  const { uid, fid, ts, sig } = req.body;

  if (!uid || !fid || !ts || !sig) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const check = crypto
    .createHash('sha256')
    .update(uid + fid + ts + SECRET)
    .digest('hex');

  if (check !== sig) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/copyMessage`,
      {
        chat_id: uid,
        from_chat_id: PRIVATE_CHANNEL_ID,
        message_id: fid
      }
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Telegram error' });
  }
});

app.listen(3000, () => {
  console.log('Unlock server running on port 3000');
});

