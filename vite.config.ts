
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' loads all env vars regardless of prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Replaces process.env.API_KEY in the code with the actual string value
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Safely handle other process.env usage if any libs need it
      'process.env': JSON.stringify({})
    },
  };
});
