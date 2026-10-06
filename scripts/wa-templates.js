import 'dotenv/config';

const version = process.env.GRAPH_API_VERSION ?? 'v25.0';
const { META_WA_TOKEN, META_WABA_ID } = process.env;
const BUSINESS = process.env.BUSINESS_NAME ?? 'Your Studio';
const base = `https://graph.facebook.com/${version}/${META_WABA_ID}/message_templates`;
const headers = { Authorization: `Bearer ${META_WA_TOKEN}`, 'Content-Type': 'application/json' };

const templates = [
  {
    name: 'call_followup_request',
    language: 'en',
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, thanks for speaking with {{2}} about your online store. We have noted your request. Tap the button below and we will send the details here.',
        example: { body_text: [['Ravi', BUSINESS]] },
      },
      { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Send me the details' }] },
    ],
  },
  {
    name: 'call_followup_summary',
    language: 'en',
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, thanks for your time on our call today. You mentioned you are planning an online store for {{2}}. Next step: {{3}}. Reply STOP if you would rather not hear from us.',
        example: { body_text: [['Ravi', 'sarees', 'our team will call you tomorrow at 4 PM']] },
      },
    ],
  },
];

const action = process.argv[2];

if (action === 'create') {
  for (const t of templates) {
    const res = await fetch(base, { method: 'POST', headers, body: JSON.stringify(t) });
    const data = await res.json().catch(() => ({}));
    console.log(
      t.name, res.status,
      JSON.stringify(data.error ? { error: { code: data.error.code, message: data.error.message } } : data)
    );
  }
} else if (action === 'status') {
  const res = await fetch(`${base}?fields=name,status,category,rejected_reason&limit=20`, { headers });
  const data = await res.json().catch(() => ({}));
  for (const t of data.data ?? []) console.log(t.name, t.status, t.category, t.rejected_reason ?? '');
  if (data.error) console.log('error', data.error.code, data.error.message);
} else {
  console.error('usage: node scripts/wa-templates.js <create|status>');
}