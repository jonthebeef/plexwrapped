<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props<{ form?: { error?: string } }>();
</script>

<svelte:head>
	<title>Sign in with Plex - Plex Wrapped</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-surface p-4">
	<div class="w-full max-w-md">
		<h1 class="mb-8 text-center text-3xl font-bold text-white">Sign in to Plex Wrapped</h1>

		<!-- Development: Manual token entry -->
		<div class="rounded-lg bg-surface-card p-6">
			<p class="mb-4 text-sm text-gray-300">Temporary dev auth: Get your Plex auth token:</p>

			<ol class="mb-4 space-y-2 text-sm text-gray-400">
				<li>
					1. Go to
					<a href="https://app.plex.tv/desktop" target="_blank" class="text-plex hover:underline">
						app.plex.tv
					</a>
				</li>
				<li>2. Open DevTools (F12) → Application → Cookies</li>
				<li>3. Find and copy the <code class="text-plex">X-Plex-Token</code> value</li>
			</ol>

			<form method="POST" use:enhance>
				<label for="token" class="mb-2 block text-sm font-medium text-gray-300"> Plex Token </label>
				<input
					type="text"
					id="token"
					name="token"
					placeholder="Paste your X-Plex-Token here"
					required
					class="mb-4 w-full rounded-lg border border-gray-600 bg-surface px-4 py-2 text-white placeholder-gray-500 focus:border-plex focus:outline-none"
				/>

				{#if form?.error}
					<p class="mb-4 text-sm text-red-400">{form.error}</p>
				{/if}

				<button
					type="submit"
					class="w-full rounded-lg bg-plex px-8 py-3 text-lg font-semibold text-black transition-colors hover:bg-plex-dark"
				>
					Sign in with Token
				</button>
			</form>

			<p class="mt-4 text-xs text-gray-500">
				Official OAuth coming soon - waiting on Plex approval
			</p>
		</div>
	</div>
</div>
