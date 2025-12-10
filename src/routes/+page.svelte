<script lang="ts">
	// Landing page - will have sign in with Plex button
</script>

<svelte:head>
	<title>Plex Wrapped - Your Year in Music</title>
</svelte:head>

<main class="min-h-screen flex flex-col items-center justify-center p-8">
	<div class="max-w-2xl text-center space-y-8">
		<h1 class="text-5xl md:text-7xl font-bold">
			<span class="text-plex">Plex</span> Wrapped
		</h1>

		<p class="text-xl md:text-2xl text-gray-400">
			Your year in music, beautifully wrapped.
		</p>

		<div class="pt-8">
			<button
				class="bg-plex hover:bg-plex-dark text-black font-semibold px-8 py-4 rounded-full text-lg transition-colors"
			>
				Sign in with Plex
			</button>
		</div>

		<p class="text-sm text-gray-500 pt-8">
			We only read your listening history. We never modify your library.
		</p>
	</div>
</main>
