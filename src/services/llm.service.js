import { env } from '../config/env.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function chatJson({ system, user, model = env.GROQ_MODEL }) {
  if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`LLM request failed (${res.status}): ${body?.error?.message ?? 'unknown'}`);
    err.status = res.status;
    throw err;
  }

  try {
    return { json: JSON.parse(body?.choices?.[0]?.message?.content), usage: body.usage ?? null };
  } catch {
    const err = new Error('LLM returned invalid JSON');
    err.invalidJson = true;
    throw err;
  }
}