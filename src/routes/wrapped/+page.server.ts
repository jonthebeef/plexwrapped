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
		console.log('🔍 Servers found:', servers.length);
		servers.forEach((s, i) => {
			console.log(`  Server ${i + 1}: ${s.name} (${s.provides})`);
		});

		const musicLibraries = await findMusicLibraries(servers, token);
		console.log('🎵 Music libraries found:', musicLibraries.length);
		musicLibraries.forEach((ml, i) => {
			console.log(
				`  Library ${i + 1}: "${ml.library.title}" (type: ${ml.library.type}) on ${ml.server.name}`
			);
		});

		// Get play history from first music library
		let playCount = 0;
		let serverName = '';
		let libraryName = '';

		if (musicLibraries.length > 0) {
			const { server, library } = musicLibraries[0];
			serverName = server.name;
			libraryName = library.title;

			const serverUrl = getBestServerUrl(server);
			console.log(`📀 Fetching history from ${serverUrl}/library/${library.key}`);

			const history = await getPlayHistory(serverUrl, token, library.key, 100); // Limit to 100 for now
			console.log(`📊 Play history items: ${history.length}`);
			playCount = history.length;
		} else {
			console.log('⚠️  No music libraries found - checking what libraries exist...');
			// Debug: check ALL libraries on each server
			for (const server of servers) {
				try {
					const serverUrl = getBestServerUrl(server);
					const { getLibraries } = await import('$lib/services/plex-api');
					const allLibs = await getLibraries(serverUrl, token);
					console.log(
						`  📚 All libraries on ${server.name}:`,
						allLibs.map((l) => `"${l.title}" (${l.type})`)
					);
				} catch (err) {
					console.error(`  ❌ Failed to get libraries from ${server.name}:`, err);
				}
			}
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
