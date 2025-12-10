<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<svelte:head>
	<title>Sign in with Plex - Plex Wrapped</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-surface p-4">
	<div class="w-full max-w-md">
		<h1 class="mb-8 text-center text-3xl font-bold text-white">Sign in to Plex Wrapped</h1>

		<div class="rounded-lg bg-surface-card p-6">
			<form method="POST" use:enhance>
				<button
					type="submit"
					class="w-full rounded-lg bg-plex px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-plex-dark"
				>
					Sign in with Plex
				</button>
			</form>

			<p class="mt-4 text-center text-xs text-gray-400">
				You'll be redirected to Plex to authorize this app
			</p>
		</div>
	</div>
</div>
