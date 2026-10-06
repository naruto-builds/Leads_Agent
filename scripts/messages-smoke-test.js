import 'dotenv/config';
import assert from 'node:assert/strict';
import { supabase } from '../src/config/supabase.js';
import * as leadModel from '../src/models/lead.model.js';
import * as callModel from '../src/models/call.model.js';
import * as messageModel from '../src/models/message.model.js';
import { isWindowOpen } from '../src/utils/window.js';
import { isStopMessage } from '../src/utils/stopWords.js';
import { makeFollowupPayload, parseFollowupPayload } from '../src/utils/buttonPayload.js';

const PHONE = '+910000000003'; // fake number, never contacted

assert.equal(isWindowOpen(null), false);
assert.equal(isWindowOpen(new Date(Date.now() - 23 * 3600e3).toISOString()), true);
assert.equal(isWindowOpen(new Date(Date.now() - 25 * 3600e3).toISOString()), false);
assert.equal(isStopMessage(' STOP '), true);
assert.equal(isStopMessage('please do not stop'), false);
assert.equal(parseFollowupPayload(makeFollowupPayload('abc-123')), 'abc-123');
assert.equal(parseFollowupPayload('something-else'), null);
console.log('pure helpers ok');

let lead;
try {
  lead = await leadModel.upsertByPhone({ phone: PHONE, name: 'Msg Test' });
  const call = await callModel.create({ leadId: lead.id, executionId: 'msg-smoke-exec' });
  const claim = { leadId: lead.id, callId: call.id, kind: 'template:call_followup_request' };

  const first = await messageModel.claimOutbound(claim);
  const second = await messageModel.claimOutbound(claim);
  console.log('first claim ok:', Boolean(first), '| second claim blocked:', second === null);

  await messageModel.markFailed(first.id, 131030);
  const retry = await messageModel.claimOutbound(claim);
  console.log('retry allowed after a failure:', Boolean(retry));

  await messageModel.markSent(retry.id, 'wamid.SMOKE1');
  await messageModel.advanceStatus('wamid.SMOKE1', 'delivered');
  await messageModel.advanceStatus('wamid.SMOKE1', 'read');
  const late = await messageModel.advanceStatus('wamid.SMOKE1', 'sent');
  console.log('status after a late "sent":', late.status);

  const t1 = new Date();
  const t0 = new Date(t1.getTime() - 3600_000);
  await leadModel.touchInbound(lead.id, t1);
  await leadModel.touchInbound(lead.id, t0);
  const fresh = await leadModel.findById(lead.id);
  console.log('last_inbound_at kept the newest:', new Date(fresh.last_inbound_at).getTime() === t1.getTime());
} finally {
  if (lead) {
    await supabase.from('messages').delete().eq('lead_id', lead.id);
    await supabase.from('leads').delete().eq('id', lead.id);
  }
  console.log('cleaned up');
}