import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function verifyMetaSignature(req, res, next) {
  const header = req.get('x-hub-signature-256') ?? '';
  if (!req.rawBody || !env.META_APP_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const expected =
    'sha256=' + crypto.createHmac('sha256', env.META_APP_SECRET).update(req.rawBody).digest('hex');

  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}