const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

const WEB_SECRET = process.env.WEB_SECRET;
const BOT_USERNAME = process.env.BOT_USERNAME; // MUST EXIST

if (!BOT_USERNAME) {
  console.error('❌ BOT_USERNAME env missing in unlock-page');
}

/* ADS PAGE */
app.get('/ads/video', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/ads/shortlink', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});

/* FINAL VERIFY → REDIRECT TO BOT */
app.post('/unlock/send', (req, res) => {
  const { uid, fid, method = 'video' } = req.body;

  if (!uid || !fid) {
    return res.json({ error: 'Invalid payload' });
  }

  const ts = Date.now();

  const token = crypto
    .createHmac('sha256', WEB_SECRET)
    .update(`${uid}:${fid}:${method}:${ts}`)
    .digest('hex');

  const payload = Buffer.from(
    JSON.stringify({ uid, fid, method, ts, token })
  ).toString('base64');

  res.json({
    redirect: `https://t.me/${BOT_USERNAME}?start=verify_${payload}`
  });
});

app.get('/', (_, res) => res.send('Unlock server alive'));

app.listen(process.env.PORT || 3000);
