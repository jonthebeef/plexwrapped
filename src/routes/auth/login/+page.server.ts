import { redirect } from '@sveltejs/kit';
import { createPlexPin, getPlexAuthUrl } from '$lib/services/plex-auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		// Create a PIN for Plex OAuth
		const pin = await createPlexPin();

		// Store PIN ID in cookie so we can poll for it in the callback
		cookies.set('plex_pin_id', String(pin.id), {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 10 // 10 minutes
		});

		// Redirect to Plex authorization page
		const authUrl = getPlexAuthUrl(pin.code);
		throw redirect(303, authUrl);
	}
};
