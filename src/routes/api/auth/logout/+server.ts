import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	// Clear all auth cookies
	cookies.delete('plex_token', { path: '/' });
	cookies.delete('plex_user', { path: '/' });
	cookies.delete('plex_pin_id', { path: '/' });

	return json({ success: true });
};
