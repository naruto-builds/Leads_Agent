import 'dotenv/config';

const base = process.env.BASE_URL ?? 'http://localhost:3000';
const executionId = process.argv[2];
if (!executionId) {
  console.error('usage: node scripts/tool-test.js <fake_execution_id>');
  process.exit(1);
}
console.log('target:', base);

const secret = encodeURIComponent(process.env.WEBHOOK_SECRET ?? '');

async function post(path, { headers = {}, body }) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  console.log(path.split('?')[0], '->', res.status, JSON.stringify(await res.json()));
}

const preCall = {
  id: executionId,
  status: 'in-progress',
  user_number: '+910000000002', // fake
  agent_id: process.env.BOLNA_AGENT_ID,
  reason: 'wants to start, asked price',
};

await post('/bolna/tool/high-intent', { body: preCall });                              // 401
await post(`/bolna/tool/high-intent?secret=${secret}`, { body: preCall });             // 200
await post(`/bolna/tool/high-intent?secret=${secret}`, { body: preCall });             // 200, ignored
await post(`/bolna/tool/high-intent?secret=${secret}`, { body: { ...preCall, agent_id: 'other' } }); // 403
await post('/bolna/tool/ack', { headers: { 'x-webhook-secret': process.env.WEBHOOK_SECRET }, body: { reason: 'x' } }); // 200