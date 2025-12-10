<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { data } = $props<{ data: { pin?: { id: number; code: string } } }>();

	let status = $state<'idle' | 'authorizing' | 'success' | 'error'>('idle');
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Auto-open Plex link when PIN is generated
	onMount(() => {
		if (data.pin) {
			status = 'authorizing';
			// Open Plex authorization page in new tab
			window.open('https://plex.tv/link', '_blank');
			startPolling();
		}
	});

	function startPolling() {
		pollInterval = setInterval(async () => {
			try {
				const response = await fetch('/api/auth/check-pin', {
					method: 'POST'
				});

				const result = await response.json();

				if (result.authenticated) {
					status = 'success';
					if (pollInterval) clearInterval(pollInterval);
					// Brief delay to show success state
					setTimeout(() => goto('/wrapped'), 1000);
				}
			} catch (error) {
				console.error('Polling error:', error);
				status = 'error';
				if (pollInterval) clearInterval(pollInterval);
			}
		}, 3000); // Poll every 3 seconds
	}

	function openPlexLink() {
		window.open('https://app.plex.tv/link', '_blank');
	}
</script>

<svelte:head>
	<title>Sign in with Plex - Plex Wrapped</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-surface p-4">
	<div class="w-full max-w-md">
		<h1 class="mb-8 text-center text-3xl font-bold text-white">Sign in to Plex Wrapped</h1>

		<div class="rounded-lg bg-surface-card p-6">
			{#if !data.pin}
				<!-- Initial state: Show sign-in button -->
				<form method="POST">
					<button
						type="submit"
						class="w-full rounded-lg bg-plex px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-plex-dark"
					>
						Sign in with Plex
					</button>
				</form>
				<p class="mt-4 text-center text-xs text-gray-400">
					Works with all Plex accounts including Apple, Google, and Facebook sign-in
				</p>
			{:else}
				<!-- PIN generated: Show authorization flow -->
				<div class="text-center">
					<h2 class="mb-4 text-xl font-semibold text-white">Authorization Code</h2>

					<div class="mb-6 rounded-lg bg-surface p-6">
						<div class="mb-2 text-sm text-gray-400">Enter this code on Plex:</div>
						<div class="text-4xl font-bold tracking-widest text-plex">{data.pin.code}</div>
					</div>

					{#if status === 'authorizing'}
						<div class="mb-6">
							<div class="mb-3 flex items-center justify-center">
								<svg class="h-8 w-8 animate-spin text-plex" viewBox="0 0 24 24">
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
							<p class="text-sm text-gray-300">Waiting for authorization...</p>
						</div>

						<button
							onclick={openPlexLink}
							class="w-full rounded-lg bg-plex px-6 py-3 font-semibold text-black transition-colors hover:bg-plex-dark"
						>
							Open Plex Authorization Page
						</button>

						<p class="mt-4 text-xs text-gray-400">
							A new tab should have opened. Enter the code above, then close the tab.
						</p>
					{:else if status === 'success'}
						<div class="mb-6 flex items-center justify-center">
							<svg class="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
								<path
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									d="M8 12l2 2 4-4"
								></path>
							</svg>
						</div>
						<p class="text-lg font-semibold text-green-400">Authorized! Redirecting...</p>
					{:else if status === 'error'}
						<div class="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
							<p class="text-sm text-red-400">Something went wrong. Please try again.</p>
						</div>
						<a
							href="/auth/login"
							class="inline-block w-full rounded-lg bg-plex px-6 py-3 text-center font-semibold text-black transition-colors hover:bg-plex-dark"
						>
							Try Again
						</a>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
