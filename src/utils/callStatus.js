const TERMINAL = new Set([
  'completed', 'no-answer', 'busy', 'failed', 'canceled', 'stopped', 'error', 'balance-low',
]);

const RANK = {
  scheduled: 0, rescheduled: 0, queued: 0, initiated: 1,
  ringing: 2, 'in-progress': 3, 'call-disconnected': 4,
};

export const isTerminal = (status) => TERMINAL.has(status);

function rank(status) {
  if (TERMINAL.has(status)) return 5;
  return RANK[status] ?? -1;
}

// Webhooks can arrive out of order, so a status may only move forward.
export function shouldAdvance(current, next) {
  return rank(next) >= rank(current);
}