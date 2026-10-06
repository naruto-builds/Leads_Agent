import 'dotenv/config';

const [mode, to, ...rest] = process.argv.slice(2);
const version = process.env.GRAPH_API_VERSION ?? 'v25.0';
const { META_WA_TOKEN, META_PHONE_NUMBER_ID } = process.env;

if (!['hello', 'text'].includes(mode) || !to || !META_WA_TOKEN || !META_PHONE_NUMBER_ID) {
  console.error('usage: node scripts/wa-send-test.js <hello|text> <91XXXXXXXXXX> [message words]');
  process.exit(1);
}

const body = {
  messaging_product: 'whatsapp',
  to,
  ...(mode === 'hello'
    ? { type: 'template', template: { name: 'hello_world', language: { code: 'en_US' } } }
    : { type: 'text', text: { body: rest.join(' ') || 'Test message from my server' } }),
};

const res = await fetch(
  `https://graph.facebook.com/${version}/${META_PHONE_NUMBER_ID}/messages`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${META_WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
);
const data = await res.json().catch(() => ({}));
console.log(
  res.status,
  JSON.stringify(data.error ? { error: { code: data.error.code, message: data.error.message } } : data)
);