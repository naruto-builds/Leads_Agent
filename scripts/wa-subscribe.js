import 'dotenv/config';

const version = process.env.GRAPH_API_VERSION ?? 'v25.0';
const { META_WA_TOKEN, META_WABA_ID } = process.env;
const action = process.argv[2];

if (!['check', 'subscribe'].includes(action) || !META_WA_TOKEN || !META_WABA_ID) {
  console.error('usage: node scripts/wa-subscribe.js <check|subscribe>');
  console.error('needs META_WA_TOKEN and META_WABA_ID in .env');
  process.exit(1);
}

const res = await fetch(
  `https://graph.facebook.com/${version}/${META_WABA_ID}/subscribed_apps`,
  {
    method: action === 'subscribe' ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${META_WA_TOKEN}` },
  }
);
const data = await res.json().catch(() => ({}));
console.log(
  res.status,
  JSON.stringify(data.error ? { error: { code: data.error.code, message: data.error.message } } : data)
);