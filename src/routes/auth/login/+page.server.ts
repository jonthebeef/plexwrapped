import { redirect, fail } from '@sveltejs/kit';
import { signInWithPassword } from '$lib/services/plex-auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		// Validate form data
		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		if (typeof email !== 'string' || typeof password !== 'string') {
			return fail(400, { error: 'Invalid form data' });
		}

		try {
			// Sign in with Plex
			const { token, user } = await signInWithPassword(email, password);

			// Set auth cookies
			cookies.set('plex_token', token, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 365 // 1 year
			});

			cookies.set(
				'plex_user',
				JSON.stringify({
					id: user.id,
					username: user.username,
					thumb: user.thumb
				}),
				{
					path: '/',
					httpOnly: false, // Client needs to read this
					secure: true,
					sameSite: 'lax',
					maxAge: 60 * 60 * 24 * 365 // 1 year
				}
			);

			// Redirect to wrapped page
			throw redirect(303, '/wrapped');
		} catch (error) {
			console.error('Sign in error:', error);
			return fail(401, {
				error: error instanceof Error ? error.message : 'Failed to sign in'
			});
		}
	}
};
