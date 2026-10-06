import { env } from '../config/env.js';
import { matches } from '../middleware/auth.middleware.js';
import * as eventModel from '../models/webhookEvent.model.js';

// Meta's one-time handshake when you click "Verify and save".
export function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && challenge && matches(token, env.META_VERIFY_TOKEN)) {
    return res.status(200).type('text/plain').send(String(challenge));
  }
  res.sendStatus(403);
}

// Replies and delivery statuses. Acknowledge first, work after.
export function receiveWebhook(req, res) {
  const body = req.body ?? {};
  res.sendStatus(200);

  processEvents(body).catch((err) =>
    console.error('whatsapp event error:', err.message)
  );
}

async function processEvents(body) {
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};

      for (const msg of value.messages ?? []) {
        const isNew = await eventModel.recordOnce({
          source: 'whatsapp',
          eventKey: `msg:${msg.id}`,
          payload: { type: msg.type, button: msg.button ?? null },
        });
        if (isNew) console.log(`whatsapp message received, type=${msg.type}`);
      }

      for (const st of value.statuses ?? []) {
        await eventModel.recordOnce({
          source: 'whatsapp',
          eventKey: `status:${st.id}:${st.status}`,
          payload: { status: st.status, error: st.errors?.[0]?.code ?? null },
        });
      }
    }
  }
}