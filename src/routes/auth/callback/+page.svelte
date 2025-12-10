<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let status = $state<'polling' | 'success' | 'error'>('polling');
	let errorMessage = $state('');

	onMount(() => {
		pollForToken();
	});

	async function pollForToken() {
		const maxAttempts = 60; // 5 minutes at 5 second intervals
		let attempts = 0;

		while (attempts < maxAttempts) {
			try {
				const response = await fetch('/api/auth/check-pin', {
					method: 'POST'
				});

				if (response.ok) {
					const data = await response.json();
					if (data.authenticated) {
						status = 'success';
						// Redirect to wrapped page after short delay
						setTimeout(() => goto('/wrapped'), 1000);
						return;
					}
				} else if (response.status === 400) {
					// No PIN cookie - user came here directly
					status = 'error';
					errorMessage = 'No authentication in progress. Please start again.';
					return;
				}
			} catch {
				// Network error, keep polling
			}

			attempts++;
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}

		status = 'error';
		errorMessage = 'Authentication timed out. Please try again.';
	}
</script>

<svelte:head>
	<title>Completing sign in... - Plex Wrapped</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-surface">
	<div class="text-center">
		{#if status === 'polling'}
			<div class="mb-6">
				<div
					class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-plex border-t-transparent"
				></div>
			</div>
			<h1 class="mb-4 text-2xl font-bold text-white">Waiting for Plex authorization...</h1>
			<p class="text-gray-400">Complete the sign-in on Plex, then come back here.</p>
		{:else if status === 'success'}
			<div class="mb-6 text-6xl">✓</div>
			<h1 class="mb-4 text-2xl font-bold text-white">Success!</h1>
			<p class="text-gray-400">Redirecting to your Wrapped...</p>
		{:else if status === 'error'}
			<div class="mb-6 text-6xl">✗</div>
			<h1 class="mb-4 text-2xl font-bold text-white">Something went wrong</h1>
			<p class="mb-6 text-gray-400">{errorMessage}</p>
			<a
				href="/auth/login"
				class="rounded-lg bg-plex px-6 py-3 font-semibold text-black transition-colors hover:bg-plex-dark"
			>
				Try again
			</a>
		{/if}
	</div>
</div>
