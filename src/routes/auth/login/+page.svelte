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
			<p class="mb-4 text-sm text-gray-300">
				Temporary dev auth: Get your token from
				<a href="https://www.plex.tv/claim" target="_blank" class="text-plex hover:underline">
					plex.tv/claim
				</a>
			</p>

			<form method="POST" action="?/manual" use:enhance>
				<label for="token" class="mb-2 block text-sm font-medium text-gray-300">
					Plex Token
				</label>
				<input
					type="text"
					id="token"
					name="token"
					placeholder="claim-xxxxxxxxxxxx"
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
