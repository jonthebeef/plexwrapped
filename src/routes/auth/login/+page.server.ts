import { createPlexPin } from '$lib/services/plex-auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	// Check if we have a PIN ID in cookies
	const pinId = cookies.get('plex_pin_id');

	if (pinId) {
		// Return PIN data so the page can show it and poll
		return {
			pin: {
				id: parseInt(pinId),
				code: cookies.get('plex_pin_code') || ''
			}
		};
	}

	return { pin: undefined };
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		// Create a PIN for Plex authentication
		const pin = await createPlexPin();

		// Store PIN ID and code in cookies
		cookies.set('plex_pin_id', String(pin.id), {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 10 // 10 minutes
		});

		cookies.set('plex_pin_code', pin.code, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 10 // 10 minutes
		});

		// Return the PIN to display on the page
		return {
			pin: {
				id: pin.id,
				code: pin.code
			}
		};
	}
};
