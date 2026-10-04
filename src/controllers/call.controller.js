import { normalizePhone } from '../utils/phone.js';
import * as bolnaService from '../services/bolna.service.js';
import * as leadModel from '../models/lead.model.js';
import * as callModel from '../models/call.model.js';

export async function startCall(req, res) {
  const body = req.body ?? {};
  const phone = normalizePhone(body.phone);
  if (!phone) {
    return res.status(400).json({ error: 'invalid_phone' });
  }
  const name =
    typeof body.name === 'string' ? body.name.trim().slice(0, 80) || undefined : undefined;

  const lead = await leadModel.upsertByPhone({ phone, name });

  const { executionId } = await bolnaService.makeCall({
    phone,
    userData: name ? { customer_name: name } : undefined,
  });

  const call = await callModel.create({ leadId: lead.id, executionId });

  res.status(202).json({ call_id: call.id, execution_id: executionId, status: 'queued' });
}