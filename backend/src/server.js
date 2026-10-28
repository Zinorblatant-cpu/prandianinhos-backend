import { buildApp } from './app.js';
import { getEnv } from './config/env.js';

const env = getEnv();
const app = buildApp();

app.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`);
});
