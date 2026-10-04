import { env } from '../config/env.js';

const BOLNA_BASE_URL = 'https://api.bolna.ai';

export async function makeCall({ phone, userData }) {
  const res = await fetch(`${BOLNA_BASE_URL}/call`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.BOLNA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: env.BOLNA_AGENT_ID,
      recipient_phone_number: phone,
      ...(userData ? { user_data: userData } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok || !body.execution_id) {
    const err = new Error(
      `Bolna call failed (${res.status}): ${JSON.stringify(body).slice(0, 200)}`
    );
    err.status = 502;
    throw err;
  }
  return { executionId: body.execution_id, status: body.status };
}