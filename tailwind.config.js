/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				plex: {
					DEFAULT: '#e5a00d',
					dark: '#cc8c00',
					light: '#f5b82e'
				},
				surface: {
					DEFAULT: '#1f1f1f',
					card: '#2a2a2a',
					elevated: '#333333'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif']
			}
		}
	},
	plugins: [require('@tailwindcss/forms')]
};
