import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getPlexServers,
	findMusicLibraries,
	getPlayHistory,
	getBestServerUrl
} from '$lib/services/plex-api';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('plex_token');
	const userCookie = cookies.get('plex_user');

	// Redirect to login if not authenticated
	if (!token || !userCookie) {
		throw redirect(303, '/auth/login');
	}

	try {
		const user = JSON.parse(userCookie);

		// Fetch Plex data
		const servers = await getPlexServers(token);
		const musicLibraries = await findMusicLibraries(servers, token);

		// Get play history from first music library
		let playCount = 0;
		let serverName = '';
		let libraryName = '';

		if (musicLibraries.length > 0) {
			const { server, library } = musicLibraries[0];
			serverName = server.name;
			libraryName = library.title;

			const serverUrl = getBestServerUrl(server);
			const history = await getPlayHistory(serverUrl, token, library.key, 100); // Limit to 100 for now
			playCount = history.length;
		}

		return {
			user: {
				id: user.id,
				username: user.username,
				thumb: user.thumb
			},
			plexData: {
				serverCount: servers.length,
				musicLibraryCount: musicLibraries.length,
				serverName,
				libraryName,
				playCount
			}
		};
	} catch (error) {
		console.error('Failed to load Plex data:', error);
		// If parsing cookie fails, clear and redirect
		cookies.delete('plex_token', { path: '/' });
		cookies.delete('plex_user', { path: '/' });
		throw redirect(303, '/auth/login');
	}
};
