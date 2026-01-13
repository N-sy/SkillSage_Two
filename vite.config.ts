import { defineConfig, loadEnv } from 'vite';
import angular from '@vitejs/plugin-angular';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' loads all env variables regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [angular()],
    define: {
      // safely expose env vars to the browser
      'process.env': env
    }
  };
});