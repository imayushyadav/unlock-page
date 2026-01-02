const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

const WEB_SECRET = process.env.WEB_SECRET;
const BOT_USERNAME = process.env.BOT_USERNAME; // MUST EXIST
const UNLOCK_BASE_URL = process.env.UNLOCK_BASE_URL;

if (!BOT_USERNAME) {
  console.error('❌ BOT_USERNAME env missing in unlock-page');
}

/* ================= VIDEO (POPUP FLOW) ================= */
app.get('/ads/video', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

/* ================= SHORTLINK (SHRINKME ONLY) ================= */
app.get('/ads/shortlink', (req, res) => {
  const { uid, fid } = req.query;
  if (!uid || !fid) return res.send('Invalid request');

  const data = Buffer.from(
    JSON.stringify({ uid, fid })
  ).toString('base64');

  const SHRINKME_LINK = 'https://shrinkme.click/x1uXkkWa';

  const redirectUrl =
    `${SHRINKME_LINK}?url=` +
    encodeURIComponent(
      `${UNLOCK_BASE_URL}/back?data=${data}`
    );

  res.redirect(redirectUrl);
});

/* ================= RETURN FROM SHORTLINK ================= */
app.get('/back', (req, res) => {
  const { data } = req.query;
  if (!data) return res.send('Invalid');

  let decoded;
  try {
    decoded = JSON.parse(
      Buffer.from(data, 'base64').toString()
    );
  } catch {
    return res.send('Invalid data');
  }

  const { uid, fid } = decoded;

  // IMPORTANT: from=shortlink flag
  res.redirect(
    `${UNLOCK_BASE_URL}/ads/video?uid=${uid}&fid=${fid}&from=shortlink`
  );
});

/* ================= FINAL VERIFY → BOT ================= */
app.post('/unlock/send', (req, res) => {
  const { uid, fid } = req.body;

  const payload = Buffer.from(
    JSON.stringify({ uid, fid })
  ).toString('base64');

  res.json({
    redirect: `https://t.me/${BOT_USERNAME}?start=verify_${payload}`
  });
});

app.get('/', (_, res) => res.send('Unlock server alive'));

app.listen(process.env.PORT || 3000);
