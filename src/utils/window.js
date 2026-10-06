const WINDOW_MS = 24 * 60 * 60 * 1000;

// Free-form WhatsApp messages are only allowed within 24 hours of the customer's last message.
export function isWindowOpen(lastInboundAt, now = new Date()) {
  if (!lastInboundAt) return false;
  const t = new Date(lastInboundAt).getTime();
  return Number.isFinite(t) && now.getTime() - t < WINDOW_MS;
}