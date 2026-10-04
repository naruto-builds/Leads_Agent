import dotenv from 'dotenv';
dotenv.config();


export const env = {
  PORT: process.env.PORT || 3000,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  BOLNA_API_KEY: process.env.BOLNA_API_KEY,
  BOLNA_AGENT_ID: process.env.BOLNA_AGENT_ID,
  CALL_SECRET: process.env.CALL_SECRET,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN,
  META_APP_SECRET: process.env.META_APP_SECRET,
};

export function checkEnv(names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}