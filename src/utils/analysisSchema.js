export class AnalysisValidationError extends Error {
  name = 'AnalysisValidationError';
}

const TEMPS = ['hot', 'warm', 'cold'];

const str = (v, max = 200) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

const strList = (v, maxItems, maxLen = 200) =>
  Array.isArray(v) ? v.map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems) : [];

export function validateAnalysis(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new AnalysisValidationError('analysis is not an object');
  }
  const temperature = typeof raw.temperature === 'string' ? raw.temperature.toLowerCase() : '';
  if (!TEMPS.includes(temperature)) {
    throw new AnalysisValidationError('invalid temperature');
  }
  const count = Number(raw.product_count);

  return {
    name: str(raw.name, 60),
    business: str(raw.business),
    product_count: Number.isFinite(count) && count > 0 ? Math.round(count) : null,
    features: strList(raw.features, 10, 60),
    timeline: str(raw.timeline),
    budget: str(raw.budget),
    callback_phrase: str(raw.callback_phrase),
    barrier: str(raw.barrier),
    temperature,
    reason: str(raw.reason, 300) ?? 'no reason given',
    key_quotes: strList(raw.key_quotes, 3, 160),
    low_confidence_fields: strList(raw.low_confidence_fields, 12, 40),
    opt_out: raw.opt_out === true,
  };
}