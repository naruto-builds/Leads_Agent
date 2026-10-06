import { env } from '../config/env.js';

export class WhatsAppError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'WhatsAppError';
    this.status = status;
    this.code = code;
  }
}

const toWaId = (phone) => phone.replace(/^\+/, '');

async function post(body) {
  if (!env.META_WA_TOKEN || !env.META_PHONE_NUMBER_ID) {
    throw new WhatsAppError('WhatsApp is not configured');
  }
  const res = await fetch(
    `https://graph.facebook.com/${env.GRAPH_API_VERSION}/${env.META_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.META_WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
      signal: AbortSignal.timeout(10_000),
    }
  );
  const data = await res.json().catch(() => ({}));
  const waMessageId = data?.messages?.[0]?.id;
  if (!res.ok || !waMessageId) {
    throw new WhatsAppError(
      `WhatsApp send failed (${res.status}): ${data?.error?.message ?? 'unknown'}`,
      { status: res.status, code: data?.error?.code }
    );
  }
  return { waMessageId };
}

// Free-form text: only works within 24 hours of the customer's last message.
export function sendText(phone, text) {
  return post({ to: toWaId(phone), type: 'text', text: { body: text } });
}

// Approved templates: the only way to message someone first.
export function sendTemplate(phone, { name, language = 'en', bodyParams = [], buttonPayloads = [] }) {
  const components = [];
  if (bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParams.map((t) => ({ type: 'text', text: String(t) })),
    });
  }
  buttonPayloads.forEach((payload, index) => {
    components.push({
      type: 'button',
      sub_type: 'quick_reply',
      index: String(index),
      parameters: [{ type: 'payload', payload }],
    });
  });
  return post({
    to: toWaId(phone),
    type: 'template',
    template: { name, language: { code: language }, components },
  });
}