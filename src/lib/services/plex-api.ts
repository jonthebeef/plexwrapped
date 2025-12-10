import { PLEX_HEADERS } from './plex-auth';

// Types for Plex API responses

export interface PlexServer {
	clientIdentifier: string;
	name: string;
	provides: string; // "server" for media servers
	owned: boolean;
	accessToken: string;
	connections: PlexConnection[];
}

export interface PlexConnection {
	protocol: string;
	address: string;
	port: number;
	uri: string;
	local: boolean;
}

export interface PlexLibrary {
	key: string; // Library section ID
	title: string;
	type: string; // "artist" for music libraries
	agent: string;
	scanner: string;
	language: string;
	uuid: string;
}

export interface PlexTrack {
	key: string;
	title: string;
	parentTitle?: string; // Album
	grandparentTitle?: string; // Artist
	viewedAt: number; // Unix timestamp
	duration: number; // Milliseconds
	type: string; // "track"
}

export interface PlexHistoryResponse {
	size: number;
	Metadata: PlexTrack[];
}

/**
 * Get user's Plex servers
 */
export async function getPlexServers(authToken: string): Promise<PlexServer[]> {
	const response = await fetch('https://plex.tv/api/v2/resources?includeHttps=1', {
		method: 'GET',
		headers: {
			...PLEX_HEADERS,
			'X-Plex-Token': authToken
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to get Plex servers: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();

	// Filter to only servers (not clients like mobile apps)
	return data.filter((resource: PlexServer) => resource.provides === 'server');
}

/**
 * Get libraries for a Plex server
 */
export async function getLibraries(serverUrl: string, authToken: string): Promise<PlexLibrary[]> {
	const response = await fetch(`${serverUrl}/library/sections`, {
		method: 'GET',
		headers: {
			...PLEX_HEADERS,
			'X-Plex-Token': authToken,
			Accept: 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to get libraries: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	return data.MediaContainer.Directory || [];
}

/**
 * Get play history for a library section
 */
export async function getPlayHistory(
	serverUrl: string,
	authToken: string,
	librarySectionId: string,
	limit = 10000
): Promise<PlexTrack[]> {
	const params = new URLSearchParams({
		librarySectionID: librarySectionId,
		sort: 'viewedAt:desc',
		'X-Plex-Container-Start': '0',
		'X-Plex-Container-Size': String(limit)
	});

	const response = await fetch(`${serverUrl}/status/sessions/history/all?${params}`, {
		method: 'GET',
		headers: {
			...PLEX_HEADERS,
			'X-Plex-Token': authToken,
			Accept: 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to get play history: ${response.status} ${response.statusText}`);
	}

	const data: PlexHistoryResponse = await response.json();
	return data.Metadata || [];
}

/**
 * Get the best server URL for a server
 * Prefers HTTPS, then local, then any available connection
 */
export function getBestServerUrl(server: PlexServer): string {
	if (!server.connections || server.connections.length === 0) {
		throw new Error('Server has no available connections');
	}

	// Prefer HTTPS connections
	const httpsConnection = server.connections.find(
		(conn) => conn.protocol === 'https' && !conn.local
	);
	if (httpsConnection) {
		return httpsConnection.uri;
	}

	// Fall back to first available connection
	return server.connections[0].uri;
}

/**
 * Find music libraries across all servers
 */
export async function findMusicLibraries(
	servers: PlexServer[],
	authToken: string
): Promise<Array<{ server: PlexServer; library: PlexLibrary }>> {
	const musicLibraries: Array<{ server: PlexServer; library: PlexLibrary }> = [];

	for (const server of servers) {
		try {
			const serverUrl = getBestServerUrl(server);
			const libraries = await getLibraries(serverUrl, authToken);

			// Find music libraries (type "artist")
			const musicLibs = libraries.filter((lib) => lib.type === 'artist');

			for (const library of musicLibs) {
				musicLibraries.push({ server, library });
			}
		} catch (error) {
			console.error(`Failed to get libraries for server ${server.name}:`, error);
			// Continue with other servers
		}
	}

	return musicLibraries;
}
