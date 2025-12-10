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

		<main class="text-center">
			<h1 class="mb-4 text-4xl font-bold text-plex">Your 2024 Wrapped</h1>
			<p class="mb-8 text-gray-400">We're building something beautiful here. Check back soon!</p>

			<div class="rounded-2xl bg-surface-card p-12">
				<p class="text-6xl">🎵</p>
				<p class="mt-4 text-xl text-gray-300">Stats coming soon...</p>
				<p class="mt-2 text-sm text-gray-500">Next up: fetching your listening history from Plex</p>
			</div>
		</main>
	</div>
</div>
