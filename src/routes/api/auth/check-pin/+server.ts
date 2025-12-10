import { json, error } from '@sveltejs/kit';
import { checkPinStatus, getPlexUser } from '$lib/services/plex-auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	const pinIdStr = cookies.get('plex_pin_id');

	if (!pinIdStr) {
		throw error(400, 'No PIN ID found');
	}

	const pinId = parseInt(pinIdStr, 10);
	if (isNaN(pinId)) {
		throw error(400, 'Invalid PIN ID');
	}

	try {
		const authToken = await checkPinStatus(pinId);

		if (!authToken) {
			// Not yet authorized, client should keep polling
			return json({ authenticated: false });
		}

		// Get user info
		const user = await getPlexUser(authToken);

		// Clear the PIN cookie
		cookies.delete('plex_pin_id', { path: '/' });

		// Set the auth token in an httpOnly cookie
		cookies.set('plex_token', authToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		// Store basic user info in a readable cookie for the client
		cookies.set(
			'plex_user',
			JSON.stringify({
				id: user.id,
				username: user.username,
				thumb: user.thumb
			}),
			{
				path: '/',
				httpOnly: false, // Client needs to read this
				secure: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			}
		);

		return json({ authenticated: true, user });
	} catch (err) {
		console.error('Error checking PIN status:', err);
		throw error(500, 'Failed to check authentication status');
	}
};
