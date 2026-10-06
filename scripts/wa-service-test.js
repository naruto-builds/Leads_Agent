import 'dotenv/config';
import { sendText } from '../src/services/whatsapp.service.js';

const [phone, ...words] = process.argv.slice(2);
if (!phone?.startsWith('+')) {
  console.error('usage: node scripts/wa-service-test.js +91XXXXXXXXXX "message"');
  process.exit(1);
}
try {
  console.log(await sendText(phone, words.join(' ') || 'Service test'));
} catch (err) {
  console.log('failed:', err.message, err.code ?? '');
}