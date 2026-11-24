# Operations

## Before a pull request
```bash
npm run ci        # build, check that generated pages are committed, test
npm run ci:all    # the same tests in Chromium, Firefox and WebKit
```
`ci:all` uses local browsers when they start and the Playwright container when WebKit cannot. It sends nothing anywhere.

## Publish
Merging to `main` runs `Publish site`. Build and deploy are separate jobs. Pages may stay in a browser for 10 minutes.

## Undo
Revert the merge commit on GitHub and merge the revert. To publish the current `main` again, run `Publish site` by hand.

## Network
DNS and proxy are on Cloudflare, hosting is GitHub Pages. GitHub Pages cannot send custom headers.

| Protection | Where |
|---|---|
| Content security policy, referrer policy | `scripts/pages.mjs`, in each page |
| No framing by other sites | `src/main.ts` |
| HSTS | Cloudflare dashboard |
| Email links left alone | `email_off` comments in each page |

Keep Cloudflare Web Analytics and Email Obfuscation off. Both change the pages. The policy blocks the first.

## Release order
When a change needs a new console or engine route, deploy the engine, then the console, then the website.
