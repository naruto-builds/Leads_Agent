import { supabase } from '../config/supabase.js';
import { throwDbError } from '../utils/dbError.js';

export async function upsertByPhone({ phone, name, language }) {
  const row = { phone, updated_at: new Date().toISOString() };
  if (name) row.name = name; // only set what we know, never overwrite with null
  if (language) row.language = language;

  const { data, error } = await supabase
    .from('leads')
    .upsert(row, { onConflict: 'phone' })
    .select()
    .single();
  if (error) throwDbError('upsert lead', error);
  return data;
}

export async function findByPhone(phone) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  if (error) throwDbError('find lead', error);
  return data;
}

export async function updateById(id, fields) {
  const { data, error } = await supabase
    .from('leads')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throwDbError('update lead', error);
  return data;
}


export async function findById(id) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throwDbError('find lead by id', error);
  return data;
}