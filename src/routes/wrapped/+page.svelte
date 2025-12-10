<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

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
			<p class="mb-8 text-center text-gray-400">
				Connected to your Plex account! Here's what we found:
			</p>

			<div class="grid gap-6 md:grid-cols-3">
				<div class="rounded-2xl bg-surface-card p-8 text-center">
					<p class="text-5xl font-bold text-plex">{data.plexData.serverCount}</p>
					<p class="mt-2 text-sm text-gray-400">
						Plex {data.plexData.serverCount === 1 ? 'Server' : 'Servers'}
					</p>
				</div>

				<div class="rounded-2xl bg-surface-card p-8 text-center">
					<p class="text-5xl font-bold text-plex">{data.plexData.musicLibraryCount}</p>
					<p class="mt-2 text-sm text-gray-400">
						Music {data.plexData.musicLibraryCount === 1 ? 'Library' : 'Libraries'}
					</p>
				</div>

				<div class="rounded-2xl bg-surface-card p-8 text-center">
					<p class="text-5xl font-bold text-plex">{data.plexData.playCount}</p>
					<p class="mt-2 text-sm text-gray-400">Recent Plays</p>
				</div>
			</div>

			{#if data.plexData.serverName && data.plexData.libraryName}
				<div class="mt-8 rounded-2xl bg-surface-card p-8">
					<p class="text-center text-6xl">🎵</p>
					<p class="mt-4 text-center text-xl text-gray-300">
						Fetching data from <span class="font-semibold text-plex"
							>{data.plexData.serverName}</span
						>
					</p>
					<p class="mt-2 text-center text-sm text-gray-500">
						Library: {data.plexData.libraryName}
					</p>
					<p class="mt-6 text-center text-sm text-gray-400">
						✅ Successfully connected to your Plex music library!
					</p>
					<p class="mt-2 text-center text-sm text-gray-500">
						Next up: calculate your top artists, albums, and tracks
					</p>
				</div>
			{/if}
		</main>
	</div>
</div>
