<script lang="ts">
	// This page just needs the form to trigger the login action
</script>

<svelte:head>
	<title>Sign in with Plex - Plex Wrapped</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-surface">
	<div class="text-center">
		<h1 class="mb-8 text-3xl font-bold text-white">Sign in to Plex Wrapped</h1>
		<form method="POST">
			<button
				type="submit"
				class="rounded-lg bg-plex px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-plex-dark"
			>
				Sign in with Plex
			</button>
		</form>
		<p class="mt-6 text-sm text-gray-400">You'll be redirected to Plex to authorize this app</p>
	</div>
</div>
