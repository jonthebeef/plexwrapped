import { PUBLIC_PLEX_CLIENT_ID } from '$env/static/public';

/**
 * Standard headers required for all Plex API requests
 */
export const PLEX_HEADERS = {
	Accept: 'application/json',
	'Content-Type': 'application/json',
	'X-Plex-Product': 'Plex Wrapped',
	'X-Plex-Version': '1.0.0',
	'X-Plex-Client-Identifier': PUBLIC_PLEX_CLIENT_ID
} as const;

export interface PlexPin {
	id: number;
	code: string;
}

export interface PlexUser {
	id: number;
	uuid: string;
	username: string;
	email: string;
	thumb: string;
}

/**
 * Create a new Plex PIN for authentication
 * User will authorize this PIN on plex.tv
 */
export async function createPlexPin(): Promise<PlexPin> {
	const response = await fetch('https://plex.tv/api/v2/pins', {
		method: 'POST',
		headers: {
			...PLEX_HEADERS,
			strong: 'true'
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to create Plex PIN: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	return {
		id: data.id,
		code: data.code
	};
}

/**
 * Generate the Plex auth URL where users authorize the app
 */
export function getPlexAuthUrl(code: string): string {
	const params = new URLSearchParams({
		clientID: PUBLIC_PLEX_CLIENT_ID,
		code,
		'context[device][product]': 'Plex Wrapped'
	});

	return `https://app.plex.tv/auth#?${params.toString()}`;
}

/**
 * Check if a PIN has been authorized by the user
 * Returns the auth token if authorized, null if still pending
 */
export async function checkPinStatus(pinId: number): Promise<string | null> {
	const response = await fetch(`https://plex.tv/api/v2/pins/${pinId}`, {
		method: 'GET',
		headers: PLEX_HEADERS
	});

	if (!response.ok) {
		throw new Error(`Failed to check PIN status: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	return data.authToken || null;
}

/**
 * Get the authenticated user's Plex profile
 */
export async function getPlexUser(authToken: string): Promise<PlexUser> {
	const response = await fetch('https://plex.tv/api/v2/user', {
		method: 'GET',
		headers: {
			...PLEX_HEADERS,
			'X-Plex-Token': authToken
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to get Plex user: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	return {
		id: data.id,
		uuid: data.uuid,
		username: data.username,
		email: data.email,
		thumb: data.thumb
	};
}
