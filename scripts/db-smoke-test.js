import 'dotenv/config';
import { supabase } from '../src/config/supabase.js';
import * as leadModel from '../src/models/lead.model.js';
import * as callModel from '../src/models/call.model.js';
import * as eventModel from '../src/models/webhookEvent.model.js';

const TEST_PHONE = '+910000000000'; // fake number, never dialled
const TEST_EXEC = 'smoke-test-exec-1';

try {
  const lead = await leadModel.upsertByPhone({ phone: TEST_PHONE, name: 'Smoke Test' });
  console.log('lead created:', lead.id);

  const again = await leadModel.upsertByPhone({ phone: TEST_PHONE });
  console.log('same lead on second upsert:', again.id === lead.id, '| name kept:', again.name);

  const call = await callModel.create({ leadId: lead.id, executionId: TEST_EXEC });
  console.log('call created:', call.id);

  const updated = await callModel.updateByExecutionId(TEST_EXEC, {
    status: 'completed',
    duration_s: 12,
  });
  console.log('call updated, status:', updated.status);

  const first = await eventModel.recordOnce({ source: 'smoke', eventKey: 'evt-1', payload: { a: 1 } });
  const second = await eventModel.recordOnce({ source: 'smoke', eventKey: 'evt-1', payload: { a: 1 } });
  console.log('event new on first try:', first, '| new on second try:', second);
} finally {
  await supabase.from('webhook_events').delete().eq('source', 'smoke');
  await supabase.from('leads').delete().eq('phone', TEST_PHONE); // cascades to calls
  console.log('cleaned up');
}