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

		<div class="rounded-lg bg-surface-card p-6">
			<form method="POST" use:enhance>
				<div class="mb-4">
					<label for="email" class="mb-2 block text-sm font-medium text-gray-300">
						Email or Username
					</label>
					<input
						type="text"
						id="email"
						name="email"
						required
						autocomplete="email"
						class="w-full rounded-lg border border-gray-600 bg-surface px-4 py-2 text-white placeholder-gray-400 focus:border-plex focus:outline-none"
						placeholder="your@email.com"
					/>
				</div>

				<div class="mb-6">
					<label for="password" class="mb-2 block text-sm font-medium text-gray-300">
						Password
					</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						autocomplete="current-password"
						class="w-full rounded-lg border border-gray-600 bg-surface px-4 py-2 text-white placeholder-gray-400 focus:border-plex focus:outline-none"
						placeholder="••••••••"
					/>
				</div>

				{#if form?.error}
					<div class="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
						<p class="text-sm text-red-400">{form.error}</p>
					</div>
				{/if}

				<button
					type="submit"
					class="w-full rounded-lg bg-plex px-8 py-3 text-lg font-semibold text-black transition-colors hover:bg-plex-dark"
				>
					Sign in with Plex
				</button>
			</form>

			<p class="mt-6 text-center text-xs text-gray-400">
				We never store your password. Your credentials are sent directly to Plex.
			</p>
		</div>
	</div>
</div>
