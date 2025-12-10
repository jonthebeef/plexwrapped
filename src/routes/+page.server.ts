import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const userCookie = cookies.get('plex_user');

	if (!userCookie) {
		return { user: null };
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
		return { user: null };
	}
};
