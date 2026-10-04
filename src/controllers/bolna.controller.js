import * as callModel from '../models/call.model.js';
import * as leadModel from '../models/lead.model.js';
import * as eventModel from '../models/webhookEvent.model.js';
import { isTerminal, shouldAdvance } from '../utils/callStatus.js';
import { normalizePhone } from '../utils/phone.js';

// Post-call webhook: Bolna sends one request per status change.
export async function postCallWebhook(req, res) {
  const body = req.body ?? {};
  const executionId = body.id;
  const status = body.status;

  if (typeof executionId !== 'string' || typeof status !== 'string') {
    return res.status(400).json({ error: 'invalid_payload' });
  }

  const isNew = await eventModel.recordOnce({
    source: 'bolna',
    eventKey: `${executionId}:${status}`,
    payload: { id: executionId, status },
  });
  if (!isNew) return res.json({ ok: true, duplicate: true });

  let call = await callModel.findByExecutionId(executionId);
  if (!call) call = await createUnknownCall(executionId, status, body);
  if (!call) return res.json({ ok: true, ignored: 'unknown_call_without_phone' });

  const fields = {};
  if (shouldAdvance(call.status, status)) fields.status = status;

  // Duration, transcript and cost are only final on a terminal status.
  if (isTerminal(status)) {
    fields.duration_s = body.conversation_duration ?? null;
    fields.transcript = body.transcript ?? null;
    fields.summary = body.summary ?? null;
    fields.raw = body;
  }

  if (Object.keys(fields).length > 0) {
    await callModel.updateByExecutionId(executionId, fields);
  }
  res.json({ ok: true });
}

// A call we did not create (e.g. started from the Bolna dashboard).
async function createUnknownCall(executionId, status, body) {
  const phone = normalizePhone(body.user_number);
  if (!phone) return null;

  const lead = await leadModel.upsertByPhone({ phone });
  try {
    return await callModel.create({ leadId: lead.id, executionId, status });
  } catch (err) {
    if (err.code === '23505') return callModel.findByExecutionId(executionId); // created in parallel
    throw err;
  }
}

// Mid-call function: Bolna waits for our reply, so answer first, work after.
export async function highIntent(req, res) {
  const body = req.body ?? {};
  const executionId = typeof body.execution_id === 'string' ? body.execution_id : null;
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : '';

  res.json({ status: 'noted' });

  if (!executionId) {
    console.warn('high-intent request without execution_id');
    return;
  }

  // Not awaited, so it needs its own catch (Express only catches the handler's promise).
  processHighIntent(executionId, reason).catch((err) =>
    console.error('high-intent background error:', err.message)
  );
}

async function processHighIntent(executionId, reason) {
  const isFirst = await eventModel.recordOnce({
    source: 'bolna-tool',
    eventKey: `high-intent:${executionId}`,
    payload: { reason },
  });
  if (!isFirst) return; // the agent may fire the function twice per call

  await callModel.updateByExecutionId(executionId, { intent_reason: reason });
  // Day 6: send the WhatsApp from here.
}