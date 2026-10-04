import 'dotenv/config'
import app from './src/app.js'
import { env, checkEnv } from './src/config/env.js';

checkEnv([
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'BOLNA_API_KEY',
  'BOLNA_AGENT_ID',
  'CALL_SECRET',
  'WEBHOOK_SECRET',
]);

const server = app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});