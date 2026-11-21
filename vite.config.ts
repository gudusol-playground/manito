import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      // Also protect local links while the development server is running.
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.private/**'],
    },
  },
});
