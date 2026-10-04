import { supabase } from '../config/supabase.js';
import { throwDbError } from '../utils/dbError.js';

export async function create({ leadId, executionId, status = 'queued' }) {
  const { data, error } = await supabase
    .from('calls')
    .insert({ lead_id: leadId, execution_id: executionId, status })
    .select()
    .single();
  if (error) throwDbError('create call', error);
  return data;
}

export async function findByExecutionId(executionId) {
  const { data, error } = await supabase
    .from('calls')
    .select('*')
    .eq('execution_id', executionId)
    .maybeSingle();
  if (error) throwDbError('find call', error);
  return data;
}

// Returns null if we never created that call (e.g. one made from the Bolna dashboard).
export async function updateByExecutionId(executionId, fields) {
  const { data, error } = await supabase
    .from('calls')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('execution_id', executionId)
    .select()
    .maybeSingle();
  if (error) throwDbError('update call', error);
  return data;
}