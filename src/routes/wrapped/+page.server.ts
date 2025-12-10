import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('plex_token');
	const userCookie = cookies.get('plex_user');

	// Redirect to login if not authenticated
	if (!token || !userCookie) {
		throw redirect(303, '/auth/login');
	}

	try {
		const user = JSON.parse(userCookie);
		return {
			user: {
				id: user.id,
				username: user.username,
				thumb: user.thumb
			}
		};
	} catch {
		// Invalid cookie, clear and redirect
		cookies.delete('plex_token', { path: '/' });
		cookies.delete('plex_user', { path: '/' });
		throw redirect(303, '/auth/login');
	}
};
