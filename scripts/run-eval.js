import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { analyseTranscript } from '../src/services/classification.service.js';
import { env } from '../src/config/env.js';

const DELAY_MS = 2200; // stay under 30 requests per minute
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LABELS = ['hot', 'warm', 'cold'];

function checkFields(expect, a) {
  const problems = [];
  if ('product_count' in expect && a.product_count !== expect.product_count)
    problems.push(`product_count ${a.product_count} (expected ${expect.product_count})`);
  if (expect.budget_null === true && a.budget !== null) problems.push(`budget should be null, got "${a.budget}"`);
  if (expect.budget_null === false && a.budget === null) problems.push('budget should not be null');
  if (expect.name_null === true && a.name !== null) problems.push(`name should be null, got "${a.name}"`);
  if (expect.callback === true && !a.callback_phrase) problems.push('missing callback_phrase');
  if (expect.callback === false && a.callback_phrase) problems.push(`unexpected callback "${a.callback_phrase}"`);
  if (expect.barrier_null === true && a.barrier !== null) problems.push(`barrier should be null, got "${a.barrier}"`);
  if ('opt_out' in expect && a.opt_out !== expect.opt_out) problems.push(`opt_out ${a.opt_out} (expected ${expect.opt_out})`);
  for (const f of expect.low_confidence ?? []) {
    if (!a.low_confidence_fields.includes(f)) problems.push(`"${f}" should be flagged low-confidence`);
  }
  return problems;
}

const datasetFile = process.argv[2] ?? 'eval/dataset.json';
const dataset = JSON.parse(await readFile(datasetFile, 'utf8'));
const matrix = Object.fromEntries(LABELS.map((e) => [e, { hot: 0, warm: 0, cold: 0 }]));
const failures = [];
let labelOk = 0;
let fieldChecks = 0;
let fieldFails = 0;

console.log(`model: ${env.GROQ_MODEL} | cases: ${dataset.length}\n`);

for (const c of dataset) {
  const transcript = c.transcript ?? (await readFile(c.file, 'utf8'));
  let a;
  try {
    a = await analyseTranscript(transcript);
  } catch (err) {
    failures.push(`${c.id}: ERROR ${err.message}`);
    console.log(`${c.id}: ERROR`);
    await sleep(DELAY_MS);
    continue;
  }
  matrix[c.expect.temperature][a.temperature]++;
  const problems = checkFields(c.expect, a);
  fieldChecks += Object.keys(c.expect).length - 1;
  fieldFails += problems.length;

  const ok = a.temperature === c.expect.temperature;
  if (ok) labelOk++;
  console.log(`${c.id}: expected ${c.expect.temperature}, got ${a.temperature} ${ok ? 'OK' : 'WRONG'}`);
  if (!ok) failures.push(`${c.id}: label ${a.temperature} (expected ${c.expect.temperature}). Model said: ${a.reason}`);
  for (const p of problems) failures.push(`${c.id}: ${p}`);
  await sleep(DELAY_MS);
}

console.log(`\nLabel accuracy: ${labelOk}/${dataset.length} = ${((labelOk / dataset.length) * 100).toFixed(1)}%`);
console.log(`Field checks failed: ${fieldFails}/${fieldChecks}`);
console.log('\nConfusion matrix (rows = expected, columns = predicted):');
console.table(matrix);
if (failures.length) console.log('\nProblems:\n- ' + failures.join('\n- '));