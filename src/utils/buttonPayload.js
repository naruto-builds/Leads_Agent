const PREFIX = 'followup:';

export const makeFollowupPayload = (executionId) => `${PREFIX}${executionId}`;

export function parseFollowupPayload(payload) {
  if (typeof payload !== 'string' || !payload.startsWith(PREFIX)) return null;
  return payload.slice(PREFIX.length) || null;
}