import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sudeepsigdel.com.np',
  vite: {
    build: {
      // The meadow (three.js, ~135 kB gzipped) is a lazy chunk loaded when the browser is idle, never on the critical path.
      chunkSizeWarningLimit: 600,
    },
  },
});
