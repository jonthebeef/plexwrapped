import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SvelteKit env module before importing the module under test
vi.mock('$env/static/public', () => ({
	PUBLIC_PLEX_CLIENT_ID: 'test-client-id'
}));

import {
	createPlexPin,
	getPlexAuthUrl,
	checkPinStatus,
	getPlexUser,
	PLEX_HEADERS
} from './plex-auth';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('plex-auth', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	describe('PLEX_HEADERS', () => {
		it('includes required Plex headers', () => {
			expect(PLEX_HEADERS['Accept']).toBe('application/json');
			expect(PLEX_HEADERS['X-Plex-Product']).toBe('Plex Wrapped');
			expect(PLEX_HEADERS['X-Plex-Client-Identifier']).toBeDefined();
		});
	});

	describe('createPlexPin', () => {
		it('creates a PIN and returns id and code', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					id: 123456,
					code: 'abc123'
				})
			});

			const result = await createPlexPin();

			expect(result).toEqual({ id: 123456, code: 'abc123' });
			expect(mockFetch).toHaveBeenCalledWith(
				'https://plex.tv/api/v2/pins',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'X-Plex-Product': 'Plex Wrapped'
					})
				})
			);
		});

		it('throws on API error', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			});

			await expect(createPlexPin()).rejects.toThrow('Failed to create Plex PIN');
		});
	});

	describe('getPlexAuthUrl', () => {
		it('returns correct auth URL with encoded parameters', () => {
			const url = getPlexAuthUrl('abc123');

			expect(url).toContain('https://app.plex.tv/auth#?');
			expect(url).toContain('code=abc123');
			expect(url).toContain('context%5Bdevice%5D%5Bproduct%5D=Plex+Wrapped');
		});
	});

	describe('checkPinStatus', () => {
		it('returns null when PIN is not yet authorized', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					id: 123456,
					authToken: null
				})
			});

			const result = await checkPinStatus(123456);

			expect(result).toBeNull();
		});

		it('returns auth token when PIN is authorized', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					id: 123456,
					authToken: 'plex-token-xyz'
				})
			});

			const result = await checkPinStatus(123456);

			expect(result).toBe('plex-token-xyz');
		});

		it('throws on API error', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: 'Not Found'
			});

			await expect(checkPinStatus(123456)).rejects.toThrow('Failed to check PIN status');
		});
	});

	describe('getPlexUser', () => {
		it('returns user info when authenticated', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					id: 12345,
					uuid: 'user-uuid',
					username: 'jonthebeef',
					email: 'jon@example.com',
					thumb: 'https://plex.tv/users/thumb.jpg'
				})
			});

			const result = await getPlexUser('plex-token-xyz');

			expect(result).toEqual({
				id: 12345,
				uuid: 'user-uuid',
				username: 'jonthebeef',
				email: 'jon@example.com',
				thumb: 'https://plex.tv/users/thumb.jpg'
			});
			expect(mockFetch).toHaveBeenCalledWith(
				'https://plex.tv/api/v2/user',
				expect.objectContaining({
					headers: expect.objectContaining({
						'X-Plex-Token': 'plex-token-xyz'
					})
				})
			);
		});

		it('throws on invalid token', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				statusText: 'Unauthorized'
			});

			await expect(getPlexUser('invalid-token')).rejects.toThrow('Failed to get Plex user');
		});
	});
});
