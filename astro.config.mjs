import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Minimal repro: server output on the Vercel adapter with i18n-style
// middleware that de-localizes locale-prefixed URLs.
export default defineConfig({
	output: 'server',
	adapter: vercel(),
});