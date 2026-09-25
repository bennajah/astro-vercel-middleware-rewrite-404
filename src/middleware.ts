import { defineMiddleware } from 'astro:middleware';

// De-localizes locale-prefixed URLs to clean routes — the same pattern used
// by Paraglide JS and other i18n middleware. Example: `/en/about` is rewritten
// to `/about` inside the render function.
//
// This rewrite happens *inside* the function, so it is invisible to Vercel's
// platform routing layer. That is what triggers the bug: `/en` and `/en/about`
// fall into the adapter's catch-all route, which stamps `status: 404`.
export const onRequest = defineMiddleware((context, next) => {
	const { pathname } = context.url;
	const match = pathname.match(/^\/(en)(\/.*)?$/);
	if (match) {
		return next(new URL(match[2] ?? '/', context.url));
	}
	return next();
});