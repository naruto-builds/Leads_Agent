import 'dotenv/config';
import crypto from 'node:crypto';

const base = process.env.BASE_URL ?? 'http://localhost:3000';
const token = process.env.META_VERIFY_TOKEN ?? '';
const secret = process.env.META_APP_SECRET ?? '';
console.log('target:', base);

const q = (t) =>
  `${base}/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(t)}&hub.challenge=abc123`;

let res = await fetch(q('wrong'));
console.log('wrong token ->', res.status);
res = await fetch(q(token));
console.log('right token ->', res.status, await res.text());

const payload = JSON.stringify({
  entry: [{ changes: [{ value: {
    messages: [{ id: 'wamid.TEST1', type: 'button', button: { payload: 'yes', text: 'Yes' } }],
    statuses: [{ id: 'wamid.TEST2', status: 'delivered' }],
  } }] }],
});
const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

async function send(label, sig) {
  const r = await fetch(`${base}/whatsapp/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(sig ? { 'x-hub-signature-256': sig } : {}) },
    body: payload,
  });
  console.log(label, '->', r.status);
}

await send('no signature', null);
await send('bad signature', 'sha256=deadbeef');
await send('good signature', signature);
await send('good signature, repeated', signature);