import crypto from 'node:crypto';
import { env } from '../config/env.js';

const digest = (value) =>
  crypto.createHash('sha256').update(String(value ?? '')).digest();

export function matches(provided, expected) {
  if (!expected) return false; // a missing secret must never authenticate
  return crypto.timingSafeEqual(digest(provided), digest(expected));
}

export function requireCallSecret(req, res, next) {
  if (!matches(req.get('x-call-secret'), env.CALL_SECRET)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

export function requireWebhookSecret(req, res, next) {
  if (!matches(req.get('x-webhook-secret'), env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

// The pre-call webhook cannot send custom headers, so for that one route the secret
// may also arrive as ?secret=...
export function requireToolSecret(req, res, next) {
  const provided = req.get('x-webhook-secret') ?? req.query.secret;
  if (!matches(provided, env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}