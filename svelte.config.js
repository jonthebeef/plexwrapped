import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			edge: false,
			split: false
		}),
		csp: {
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'https:'],
				'connect-src': ['self', 'https://plex.tv', 'https://*.plex.direct', 'https://*.supabase.co'],
				'frame-ancestors': ['none']
			}
		}
	}
};

export default config;
