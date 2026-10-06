import { chatJson } from './llm.service.js';
import { validateAnalysis, AnalysisValidationError } from '../utils/analysisSchema.js';
import * as callModel from '../models/call.model.js';
import * as leadModel from '../models/lead.model.js';

const SYSTEM_PROMPT = `You analyse phone-call transcripts between an AI sales assistant ("assistant") and a potential customer ("user") about building an e-commerce website. The transcript comes from speech recognition, so some words may be misheard.

Return ONLY one JSON object with exactly these keys:
- "name": the customer's name, or null
- "business": what the customer sells, or null
- "product_count": number of products as an integer, or null
- "features": array of features the customer asked for (short phrases), empty if none
- "timeline": when they want to go live, in their own words, or null
- "budget": their budget in their own words, or null
- "callback_phrase": the exact words they used for a callback time, or null
- "barrier": the main thing the customer says is holding them back (budget not ready, bad timing, someone else decides, other), or null. A budget that is simply not decided yet is NOT a barrier. Use null when nothing blocks them
- "temperature": "hot", "warm" or "cold"
- "reason": one sentence explaining the temperature
- "key_quotes": up to 3 short verbatim quotes from the customer's lines that best show their intent
- "low_confidence_fields": names of fields that have a non-null value but may come from a speech-recognition error or that the customer did not clearly confirm. Never list a field whose value is null
- "opt_out": true only if the customer asked not to be contacted again, otherwise false

Rules:
- Use only what the customer said. Use null or an empty array when something is unknown. Never guess or invent.
- The assistant's own words are not facts about the customer, unless the customer confirmed them.
- Do not treat a title such as "sir" or "madam" as a name.

Temperature:
- hot: the customer wants to proceed or start, or asks about price or how soon work can begin, or commits to a clear next step.
- warm: real interest or need, but something holds them back, for example budget not ready, bad timing, someone else decides ("my brother handles this"), wants details before deciding, or asks for a callback later.
- cold: only curious, no clear need, declines, says they are not interested, or barely engaged.
Indirect cues: "send me the details" alone is warm. "How soon can you start" is hot. "My budget is not much right now" is warm with barrier "budget". "Call me tomorrow" is warm with a callback_phrase. "Do not call me again" is cold with opt_out true. If the customer never spoke, return cold.`;

export function hasCustomerSpeech(transcript) {
  return (
    typeof transcript === 'string' &&
    transcript.split('\n').some((line) => /^user:\s*\S/i.test(line.trim()))
  );
}

const retryable = (err) => err.invalidJson || err instanceof AnalysisValidationError;

function keepVerbatimQuotes(analysis, transcript) {
  const text = transcript.toLowerCase();
  return {
    ...analysis,
    key_quotes: analysis.key_quotes.filter((q) => text.includes(q.toLowerCase())),
  };
}

export async function analyseTranscript(transcript) {
  if (!hasCustomerSpeech(transcript)) {
    return validateAnalysis({
      temperature: 'cold',
      reason: 'The customer did not speak during the call.',
    });
  }

  const user = `Transcript:\n${transcript.slice(0, 12000)}`;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { json } = await chatJson({ system: SYSTEM_PROMPT, user });
            return keepVerbatimQuotes(validateAnalysis(json), transcript);
    } catch (err) {
      lastError = err;
      if (!retryable(err)) throw err; // network and rate-limit errors are not retried here
    }
  }
  throw lastError;
}

const PROFILE_KEYS = ['business', 'product_count', 'features', 'timeline', 'budget', 'barrier'];

export async function classifyCall(executionId) {
  const call = await callModel.findByExecutionId(executionId);
  if (!call || call.analysis) return null; // unknown call, or already analysed

  const analysis = await analyseTranscript(call.transcript);
  await callModel.saveAnalysis(executionId, analysis);

  const lead = await leadModel.findById(call.lead_id);
  if (!lead) return analysis;

  const profile = { ...(lead.profile ?? {}) };
  for (const key of PROFILE_KEYS) {
    const value = analysis[key];
    const empty = value === null || (Array.isArray(value) && value.length === 0);
    if (!empty && !analysis.low_confidence_fields.includes(key)) profile[key] = value;
  }

  const fields = { temperature: analysis.temperature, profile };
  if (!lead.name && analysis.name && !analysis.low_confidence_fields.includes('name')) {
    fields.name = analysis.name;
  }
  if (analysis.opt_out) fields.opt_out = true;

  await leadModel.updateById(lead.id, fields);
  return analysis;
}