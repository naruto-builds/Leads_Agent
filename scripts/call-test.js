import 'dotenv/config';

const phone = process.argv[2];
const secret = process.argv[3] === 'nosecret' ? '' : process.env.CALL_SECRET;

const res = await fetch('http://localhost:3000/api/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-call-secret': secret },
  body: JSON.stringify({ phone }),
});
console.log(res.status, await res.json());