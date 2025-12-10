<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		getPlexServers,
		findMusicLibraries,
		getPlayHistory,
		getBestServerUrl
	} from '$lib/services/plex-api';

	let { data } = $props();

	let loading = $state(true);
	let error = $state<string | null>(null);
	let plexData = $state({
		serverCount: 0,
		musicLibraryCount: 0,
		serverName: '',
		libraryName: '',
		playCount: 0
	});

	onMount(async () => {
		try {
			// Fetch Plex data client-side (can reach local/VPN servers)
			const servers = await getPlexServers(data.token);
			const musicLibraries = await findMusicLibraries(servers, data.token);

			let allPlays = 0;
			const serverNames: string[] = [];
			const libraryNames: string[] = [];

			// Fetch play history from ALL music libraries across ALL servers
			for (const { server, library } of musicLibraries) {
				try {
					const serverUrl = getBestServerUrl(server);
					const history = await getPlayHistory(serverUrl, data.token, library.key, 100);
					allPlays += history.length;
					serverNames.push(server.name);
					libraryNames.push(library.title);
					console.log(`Fetched ${history.length} plays from ${server.name} (${library.title})`);
				} catch (err) {
					console.error(`Failed to fetch from ${server.name} (${library.title}):`, err);
					// Continue to next library even if this one fails
				}
			}

			plexData = {
				serverCount: servers.length,
				musicLibraryCount: musicLibraries.length,
				serverName: serverNames.join(', '),
				libraryName: libraryNames.join(', '),
				playCount: allPlays
			};

			loading = false;
		} catch (err) {
			console.error('Failed to fetch Plex data:', err);
			error = err instanceof Error ? err.message : 'Failed to load Plex data';
			loading = false;
		}
	});

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/');
	}
</script>

<svelte:head>
	<title>Your Wrapped - Plex Wrapped</title>
</svelte:head>

<div class="min-h-screen bg-surface p-8">
	<div class="mx-auto max-w-4xl">
		<header class="mb-12 flex items-center justify-between">
			<div class="flex items-center gap-4">
				{#if data.user.thumb}
					<img src={data.user.thumb} alt={data.user.username} class="h-12 w-12 rounded-full" />
				{/if}
				<div>
					<p class="text-sm text-gray-400">Welcome back,</p>
					<p class="text-xl font-bold text-white">{data.user.username}</p>
				</div>
			</div>
			<button
				onclick={logout}
				class="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
			>
				Sign out
			</button>
		</header>

		<main>
			<h1 class="mb-4 text-center text-4xl font-bold text-plex">Your 2024 Wrapped</h1>

			{#if loading}
				<p class="mb-8 text-center text-gray-400">
					Connecting to your Plex servers and fetching your music library...
				</p>

				<div class="flex items-center justify-center">
					<svg class="h-12 w-12 animate-spin text-plex" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
							fill="none"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</div>
			{:else if error}
				<p class="mb-8 text-center text-gray-400">Something went wrong:</p>

				<div class="rounded-2xl bg-red-500/10 p-8">
					<p class="text-center text-red-400">{error}</p>
					<p class="mt-4 text-center text-sm text-gray-400">
						Make sure your Plex servers are running and accessible.
					</p>
				</div>
			{:else}
				<p class="mb-8 text-center text-gray-400">
					Connected to your Plex account! Here's what we found:
				</p>

				<div class="grid gap-6 md:grid-cols-3">
					<div class="rounded-2xl bg-surface-card p-8 text-center">
						<p class="text-5xl font-bold text-plex">{plexData.serverCount}</p>
						<p class="mt-2 text-sm text-gray-400">
							Plex {plexData.serverCount === 1 ? 'Server' : 'Servers'}
						</p>
					</div>

					<div class="rounded-2xl bg-surface-card p-8 text-center">
						<p class="text-5xl font-bold text-plex">{plexData.musicLibraryCount}</p>
						<p class="mt-2 text-sm text-gray-400">
							Music {plexData.musicLibraryCount === 1 ? 'Library' : 'Libraries'}
						</p>
					</div>

					<div class="rounded-2xl bg-surface-card p-8 text-center">
						<p class="text-5xl font-bold text-plex">{plexData.playCount}</p>
						<p class="mt-2 text-sm text-gray-400">Recent Plays</p>
					</div>
				</div>

				{#if plexData.serverName && plexData.libraryName}
					<div class="mt-8 rounded-2xl bg-surface-card p-8">
						<p class="text-center text-6xl">🎵</p>
						<p class="mt-4 text-center text-xl text-gray-300">
							Fetching data from <span class="font-semibold text-plex">{plexData.serverName}</span>
						</p>
						<p class="mt-2 text-center text-sm text-gray-500">
							Library: {plexData.libraryName}
						</p>
						<p class="mt-6 text-center text-sm text-gray-400">
							✅ Successfully connected to your Plex music library!
						</p>
						<p class="mt-2 text-center text-sm text-gray-500">
							Next up: calculate your top artists, albums, and tracks
						</p>
					</div>
				{/if}
			{/if}
		</main>
	</div>
</div>
