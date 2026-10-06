import * as callModel from '../models/call.model.js';
import * as leadModel from '../models/lead.model.js';
import * as eventModel from '../models/webhookEvent.model.js';
import { isTerminal, shouldAdvance } from '../utils/callStatus.js';
import { normalizePhone } from '../utils/phone.js';
import { env } from '../config/env.js';
import { classifyCall } from '../services/classification.service.js';

// Bolna's payload echoes our tool config, headers included, so drop it before storing.
function sanitizeRaw(body) {
  const copy = structuredClone(body);
  if (copy.usage_breakdown) delete copy.usage_breakdown.api_tools;
  return copy;
}

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
    fields.raw = sanitizeRaw(body);
  }

  if (Object.keys(fields).length > 0) {
    await callModel.updateByExecutionId(executionId, fields);
  }

  if (status === 'completed') {
    // Not awaited: the LLM takes seconds and Bolna is waiting for our reply.
    classifyCall(executionId).catch((err) =>
      console.error('classification error:', err.message)
    );
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

// Bolna's pre-call webhook: fire-and-forget, body = full call record + our `reason`.
export async function highIntent(req, res) {
  const body = req.body ?? {};
  const executionId = typeof body.id === 'string' ? body.id : null;
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : '';

  if (!executionId) {
    return res.status(400).json({ error: 'invalid_payload' });
  }
  if (body.agent_id && body.agent_id !== env.BOLNA_AGENT_ID) {
    return res.status(403).json({ error: 'wrong_agent' });
  }

  res.json({ status: 'noted' });

  // Not awaited, so it needs its own catch.
  processHighIntent(executionId, reason, body).catch((err) =>
    console.error('high-intent background error:', err.message)
  );
}

async function processHighIntent(executionId, reason, body) {
  const isFirst = await eventModel.recordOnce({
    source: 'bolna-tool',
    eventKey: `high-intent:${executionId}`,
    payload: { reason },
  });
  if (!isFirst) return; // the agent may fire the function twice per call

  let call = await callModel.findByExecutionId(executionId);
  if (!call) call = await createUnknownCall(executionId, 'in-progress', body);
  if (!call) {
    console.warn('high-intent for an unknown call without a phone number');
    return;
  }

  await callModel.updateByExecutionId(executionId, { intent_reason: reason });
  // Day 6: send the WhatsApp to the lead's number from here.
}

// The tool's main (blocking) request: answer fast so the agent keeps talking.
export function toolAck(_req, res) {
  res.json({ status: 'noted' });
}