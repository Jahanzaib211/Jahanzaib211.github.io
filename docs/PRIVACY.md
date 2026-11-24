# Analytics and privacy, for maintainers

The public text is in `content/cookies.part.html`, `privacy.part.html` and `pages-i18n.mjs`. Change all four languages together.

- Nothing is counted before Accept. Reject and a Global Privacy Control signal mean no.
- `alx_consent` holds the version and the answer. Raise the version in `src/consent.ts` when a service is added, so people are asked again.
- First-party counts hold event, path, source site, language and device. The console turns the address into a code that changes daily.
- Google Analytics `G-612W223T3P` loads once. Do not add the Tag Manager container `GTM-NZKD7T8C` too. It holds the same stream.
- Advertising and user data are denied in code. Keep Google signals and user-provided data off in the Google account.
- The address sent to Google leaves out the query string.
