import { supabase } from '../config/supabase.js';
import { throwDbError } from '../utils/dbError.js';

// Returns true if this event is new, false if we have seen it before.
export async function recordOnce({ source, eventKey, payload }) {
  const { error } = await supabase
    .from('webhook_events')
    .insert({ source, event_key: eventKey, payload });

  if (!error) return true;
  if (error.code === '23505') return false; // unique violation: already processed
  throwDbError('record webhook event', error);
}