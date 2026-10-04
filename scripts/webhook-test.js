import 'dotenv/config';

const executionId = process.argv[2];
if (!executionId) {
  console.error('usage: node scripts/webhook-test.js <execution_id>');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'x-webhook-secret': process.env.WEBHOOK_SECRET,
};

async function post(path, body) {
  const res = await fetch(`${process.env.BASE_URL ?? 'http://localhost:3000'}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  console.log(path, body.status ?? '', '->', res.status, JSON.stringify(await res.json()));
}

await post('/bolna/webhook', { id: executionId, status: 'ringing' });
await post('/bolna/tool/high-intent', { execution_id: executionId, reason: 'I want to start' });
await post('/bolna/tool/high-intent', { execution_id: executionId, reason: 'second firing' });
await post('/bolna/webhook', { id: executionId, status: 'in-progress' });
await post('/bolna/webhook', { id: executionId, status: 'call-disconnected' });
await post('/bolna/webhook', {
  id: executionId, status: 'completed',
  conversation_duration: 44, transcript: 'assistant: hi\nuser: hello', summary: 'Test call',
});
await post('/bolna/webhook', { id: executionId, status: 'completed' }); // duplicate
await post('/bolna/webhook', { id: executionId, status: 'queued' });    // late, out of order
await post('/bolna/webhook', { id: 'unknown-exec-1', status: 'ringing', user_number: '+910000000001' });