import { redirect, fail } from '@sveltejs/kit';
import {
	createPlexPin,
	getPlexAuthUrl,
	getPlexUser,
	exchangeClaimToken
} from '$lib/services/plex-auth';
import type { Actions } from './$types';

export const actions: Actions = {
	// OAuth flow (currently disabled - waiting for Plex approval)
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
	},

	// Manual token auth for development
	manual: async ({ cookies, request }) => {
		const data = await request.formData();
		let token = (data.get('token') as string)?.trim();

		if (!token || token.length === 0) {
			return fail(400, { error: 'Token is required' });
		}

		try {
			// If it's a claim token (starts with "claim-"), exchange it for a real token
			if (token.startsWith('claim-')) {
				token = await exchangeClaimToken(token);
			}

			// Validate token by fetching user
			const user = await getPlexUser(token);

			// Set auth token cookie
			cookies.set('plex_token', token, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});

			// Set user info cookie for display
			cookies.set('plex_user', JSON.stringify(user), {
				path: '/',
				httpOnly: false, // Needs to be readable by client
				secure: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30
			});

			throw redirect(303, '/wrapped');
		} catch (error) {
			console.error('Token validation failed:', error);
			return fail(401, { error: 'Invalid token - please check and try again' });
		}
	}
};
