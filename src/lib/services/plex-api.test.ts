import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SvelteKit env module
vi.mock('$env/static/public', () => ({
	PUBLIC_PLEX_CLIENT_ID: 'test-client-id'
}));

import {
	getPlexServers,
	getLibraries,
	getPlayHistory,
	getBestServerUrl,
	findMusicLibraries,
	type PlexServer
} from './plex-api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('plex-api', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	describe('getPlexServers', () => {
		it('fetches and filters servers', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => [
					{ name: 'My Server', provides: 'server', clientIdentifier: 'abc123' },
					{ name: 'My Phone', provides: 'client', clientIdentifier: 'def456' },
					{ name: 'Another Server', provides: 'server', clientIdentifier: 'ghi789' }
				]
			});

			const servers = await getPlexServers('test-token');

			expect(servers).toHaveLength(2);
			expect(servers[0].name).toBe('My Server');
			expect(servers[1].name).toBe('Another Server');
			expect(mockFetch).toHaveBeenCalledWith(
				'https://plex.tv/api/v2/resources?includeHttps=1',
				expect.objectContaining({
					headers: expect.objectContaining({
						'X-Plex-Token': 'test-token'
					})
				})
			);
		});

		it('throws on failed request', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				statusText: 'Unauthorized'
			});

			await expect(getPlexServers('bad-token')).rejects.toThrow('Failed to get Plex servers');
		});
	});

	describe('getLibraries', () => {
		it('fetches libraries for a server', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					MediaContainer: {
						Directory: [
							{ key: '1', title: 'Music', type: 'artist' },
							{ key: '2', title: 'Movies', type: 'movie' }
						]
					}
				})
			});

			const libraries = await getLibraries('http://localhost:32400', 'test-token');

			expect(libraries).toHaveLength(2);
			expect(libraries[0].title).toBe('Music');
			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:32400/library/sections',
				expect.objectContaining({
					headers: expect.objectContaining({
						'X-Plex-Token': 'test-token'
					})
				})
			);
		});

		it('returns empty array if no libraries', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					MediaContainer: {}
				})
			});

			const libraries = await getLibraries('http://localhost:32400', 'test-token');

			expect(libraries).toEqual([]);
		});

		it('throws on failed request', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			});

			await expect(getLibraries('http://localhost:32400', 'test-token')).rejects.toThrow(
				'Failed to get libraries'
			);
		});
	});

	describe('getPlayHistory', () => {
		it('fetches play history for a library', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					size: 2,
					Metadata: [
						{
							key: '/library/metadata/123',
							title: 'Song 1',
							grandparentTitle: 'Artist 1',
							parentTitle: 'Album 1',
							viewedAt: 1234567890,
							duration: 180000,
							type: 'track'
						},
						{
							key: '/library/metadata/456',
							title: 'Song 2',
							grandparentTitle: 'Artist 2',
							parentTitle: 'Album 2',
							viewedAt: 1234567800,
							duration: 240000,
							type: 'track'
						}
					]
				})
			});

			const history = await getPlayHistory('http://localhost:32400', 'test-token', '1');

			expect(history).toHaveLength(2);
			expect(history[0].title).toBe('Song 1');
			expect(history[0].grandparentTitle).toBe('Artist 1');
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/status/sessions/history/all'),
				expect.objectContaining({
					headers: expect.objectContaining({
						'X-Plex-Token': 'test-token'
					})
				})
			);
		});

		it('returns empty array if no history', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					size: 0
				})
			});

			const history = await getPlayHistory('http://localhost:32400', 'test-token', '1');

			expect(history).toEqual([]);
		});

		it('throws on failed request', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: 'Not Found'
			});

			await expect(getPlayHistory('http://localhost:32400', 'test-token', '1')).rejects.toThrow(
				'Failed to get play history'
			);
		});
	});

	describe('getBestServerUrl', () => {
		it('prefers local connections', () => {
			const server: PlexServer = {
				clientIdentifier: 'abc123',
				name: 'My Server',
				provides: 'server',
				owned: true,
				accessToken: 'token',
				connections: [
					{
						protocol: 'http',
						address: '192.168.1.100',
						port: 32400,
						uri: 'http://192.168.1.100:32400',
						local: true
					},
					{
						protocol: 'https',
						address: 'abc123.plex.direct',
						port: 32400,
						uri: 'https://abc123.plex.direct:32400',
						local: false
					},
					{
						protocol: 'http',
						address: 'localhost',
						port: 32400,
						uri: 'http://localhost:32400',
						local: true
					}
				]
			};

			const url = getBestServerUrl(server);

			expect(url).toBe('http://192.168.1.100:32400');
		});

		it('falls back to first connection if no local', () => {
			const server: PlexServer = {
				clientIdentifier: 'abc123',
				name: 'My Server',
				provides: 'server',
				owned: true,
				accessToken: 'token',
				connections: [
					{
						protocol: 'http',
						address: '192.168.1.100',
						port: 32400,
						uri: 'http://192.168.1.100:32400',
						local: true
					},
					{
						protocol: 'http',
						address: 'localhost',
						port: 32400,
						uri: 'http://localhost:32400',
						local: true
					}
				]
			};

			const url = getBestServerUrl(server);

			expect(url).toBe('http://192.168.1.100:32400');
		});

		it('throws if no connections', () => {
			const server: PlexServer = {
				clientIdentifier: 'abc123',
				name: 'My Server',
				provides: 'server',
				owned: true,
				accessToken: 'token',
				connections: []
			};

			expect(() => getBestServerUrl(server)).toThrow('Server has no available connections');
		});
	});

	describe('findMusicLibraries', () => {
		it('finds music libraries across multiple servers', async () => {
			const servers: PlexServer[] = [
				{
					clientIdentifier: 'server1',
					name: 'Server 1',
					provides: 'server',
					owned: true,
					accessToken: 'token1',
					connections: [
						{
							protocol: 'http',
							address: 'localhost',
							port: 32400,
							uri: 'http://localhost:32400',
							local: true
						}
					]
				},
				{
					clientIdentifier: 'server2',
					name: 'Server 2',
					provides: 'server',
					owned: true,
					accessToken: 'token2',
					connections: [
						{
							protocol: 'http',
							address: 'localhost',
							port: 32401,
							uri: 'http://localhost:32401',
							local: true
						}
					]
				}
			];

			// Mock getLibraries calls
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						MediaContainer: {
							Directory: [
								{ key: '1', title: 'Music', type: 'artist' },
								{ key: '2', title: 'Movies', type: 'movie' }
							]
						}
					})
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						MediaContainer: {
							Directory: [{ key: '3', title: 'Music Library', type: 'artist' }]
						}
					})
				});

			const musicLibs = await findMusicLibraries(servers, 'test-token');

			expect(musicLibs).toHaveLength(2);
			expect(musicLibs[0].library.title).toBe('Music');
			expect(musicLibs[0].server.name).toBe('Server 1');
			expect(musicLibs[1].library.title).toBe('Music Library');
			expect(musicLibs[1].server.name).toBe('Server 2');
		});

		it('continues if a server fails', async () => {
			const servers: PlexServer[] = [
				{
					clientIdentifier: 'server1',
					name: 'Server 1',
					provides: 'server',
					owned: true,
					accessToken: 'token1',
					connections: [
						{
							protocol: 'http',
							address: 'localhost',
							port: 32400,
							uri: 'http://localhost:32400',
							local: true
						}
					]
				},
				{
					clientIdentifier: 'server2',
					name: 'Server 2',
					provides: 'server',
					owned: true,
					accessToken: 'token2',
					connections: [
						{
							protocol: 'http',
							address: 'localhost',
							port: 32401,
							uri: 'http://localhost:32401',
							local: true
						}
					]
				}
			];

			// First server fails, second succeeds
			mockFetch
				.mockResolvedValueOnce({
					ok: false,
					status: 500,
					statusText: 'Internal Server Error'
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						MediaContainer: {
							Directory: [{ key: '3', title: 'Music', type: 'artist' }]
						}
					})
				});

			const musicLibs = await findMusicLibraries(servers, 'test-token');

			expect(musicLibs).toHaveLength(1);
			expect(musicLibs[0].server.name).toBe('Server 2');
		});
	});
});
