import { defineConfig, loadEnv } from 'vite';
import angular from '@vitejs/plugin-angular';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Vercel injects environment variables into process.env.
  // We need to make sure API_KEY is present in the `env` object passed to the browser.
  if (process.env['API_KEY']) {
    env['API_KEY'] = process.env['API_KEY'];
  }

  return {
    plugins: [angular()],
    define: {
      // safely expose env vars to the browser
      'process.env': JSON.stringify(env)
    }
  };
});