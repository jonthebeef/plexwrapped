/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			user?: {
				id: string;
				plexUserId: string;
				plexUsername: string;
				plexToken: string;
			};
		}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface PageData {}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface PageState {}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface Platform {}
	}
}

export {};
