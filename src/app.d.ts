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
		interface PageData {}
		interface PageState {}
		interface Platform {}
	}
}

export {};
