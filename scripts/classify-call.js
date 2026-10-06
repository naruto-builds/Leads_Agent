import 'dotenv/config';
import { classifyCall } from '../src/services/classification.service.js';

const id = process.argv[2];
if (!id) {
  console.error('usage: node scripts/classify-call.js <execution_id>');
  process.exit(1);
}
console.log(JSON.stringify(await classifyCall(id), null, 2));