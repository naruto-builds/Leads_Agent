const STOP_WORDS = new Set(['stop', 'unsubscribe', 'cancel', 'quit', 'opt out', 'optout']);

// Whole-message match only, so "please don't stop" is not treated as an opt-out.
export function isStopMessage(text) {
  if (typeof text !== 'string') return false;
  return STOP_WORDS.has(text.trim().toLowerCase().replace(/[.!]+$/, ''));
}