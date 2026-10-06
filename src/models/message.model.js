import { supabase } from '../config/supabase.js';
import { throwDbError } from '../utils/dbError.js';

const RANK = { queued: 0, sent: 1, delivered: 2, read: 3, failed: 4 };
export const statusRank = (s) => RANK[s] ?? -1;

// Claims the right to send. Returns null if this kind was already sent for this call.
export async function claimOutbound({ leadId, callId, kind, bodyPreview = null }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      lead_id: leadId,
      call_id: callId ?? null,
      direction: 'outbound',
      kind,
      status: 'queued',
      body_preview: bodyPreview ? bodyPreview.slice(0, 200) : null,
    })
    .select()
    .single();
  if (!error) return data;
  if (error.code === '23505') return null;
  throwDbError('claim outbound message', error);
}

export async function markSent(id, waMessageId) {
  const { error } = await supabase
    .from('messages')
    .update({ wa_message_id: waMessageId, status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throwDbError('mark message sent', error);
}

export async function markFailed(id, errorCode) {
  const { error } = await supabase
    .from('messages')
    .update({
      status: 'failed',
      error_code: String(errorCode ?? 'unknown'),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throwDbError('mark message failed', error);
}

// Returns true if new, false if this inbound message was already stored.
export async function recordInbound({ leadId, waMessageId, kind, bodyPreview = null }) {
  const { error } = await supabase.from('messages').insert({
    lead_id: leadId,
    direction: 'inbound',
    kind,
    wa_message_id: waMessageId,
    status: 'received',
    body_preview: bodyPreview ? bodyPreview.slice(0, 200) : null,
  });
  if (!error) return true;
  if (error.code === '23505') return false;
  throwDbError('record inbound message', error);
}

// Statuses only move forward, because webhooks can arrive out of order.
export async function advanceStatus(waMessageId, status, errorCode = null) {
  const { data: row, error } = await supabase
    .from('messages')
    .select('id, status')
    .eq('wa_message_id', waMessageId)
    .maybeSingle();
  if (error) throwDbError('find message', error);
  if (!row) return null;
  if (statusRank(status) <= statusRank(row.status)) return row;

  const { data, error: updateError } = await supabase
    .from('messages')
    .update({
      status,
      error_code: errorCode ? String(errorCode) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select()
    .single();
  if (updateError) throwDbError('advance message status', updateError);
  return data;
}