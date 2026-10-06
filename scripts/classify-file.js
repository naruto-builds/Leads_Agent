import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { analyseTranscript } from '../src/services/classification.service.js';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/classify-file.js <transcript.txt>');
  process.exit(1);
}
const transcript = await readFile(file, 'utf8');
console.log(JSON.stringify(await analyseTranscript(transcript), null, 2));