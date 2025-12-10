<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Plex Wrapped - Your Year in Music</title>
</svelte:head>

<main class="flex min-h-screen flex-col items-center justify-center p-8">
	<div class="max-w-2xl space-y-8 text-center">
		<h1 class="text-5xl font-bold md:text-7xl">
			<span class="text-plex">Plex</span> Wrapped
		</h1>

		<p class="text-xl text-gray-400 md:text-2xl">Your year in music, beautifully wrapped.</p>

		<div class="pt-8">
			{#if data.user}
				<a
					href="/wrapped"
					class="inline-block rounded-full bg-plex px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-plex-dark"
				>
					View Your Wrapped
				</a>
			{:else}
				<a
					href="/auth/login"
					class="inline-block rounded-full bg-plex px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-plex-dark"
				>
					Sign in with Plex
				</a>
			{/if}
		</div>

		<p class="pt-8 text-sm text-gray-500">
			We only read your listening history. We never modify your library.
		</p>
	</div>
</main>
