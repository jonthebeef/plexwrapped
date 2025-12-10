import { redirect } from '@sveltejs/kit';
import { createPlexPin, getPlexAuthUrl } from '$lib/services/plex-auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		// Create a new PIN
		const pin = await createPlexPin();

		// Store PIN ID in a cookie so we can check it later
		cookies.set('plex_pin_id', String(pin.id), {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 10 // 10 minutes
		});

		// Redirect to Plex auth page
		const authUrl = getPlexAuthUrl(pin.code);
		throw redirect(303, authUrl);
	}
};
