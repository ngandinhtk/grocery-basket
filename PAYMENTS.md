Basket Premium costs USD 3.00 once (reference price USD 18). `PREMIUM_OFFER` in `worker/index.mjs` is the source for displayed prices and checkout; the browser contains no fallback price. PayPal creates and captures orders on the server. An approved or pending order never grants access. A completed USD 3.00 capture is bound to the signed-in Sites user and persisted in D1. Repeated capture requests reconcile the original order instead of charging again. Capture status is rechecked at most five minutes apart; confirmed refunded or reversed purchases lose access. During network failures, throttling or PayPal 5xx errors, previously verified purchases retain access for up to 24 hours from the last successful verification, with five-minute retry backoff. Failures never advance that verification timestamp, grant a new membership, or restore a revoked one.

Premium currently provides account-owned shopping templates and a seven-day meal plan. Existing grocery lists, budget tracking, editing, and built-in templates remain free. Saved templates are capped at 100 per account and 200 ingredients per template. The grocery list itself stays on the current device.

New templates retain their currency. Legacy templates have unknown currency. Imports from an unknown or different currency omit template prices instead of relabeling them; the user is told to enter local prices. The import dialog offers merging, keeping separate rows, or skipping compatible ingredients. Merging requires matching names, categories and units; it uses a weighted unit price to preserve the estimated total. Different units and quantity overflows remain separate.

Template refreshes never reload the weekly plan. Status refreshes preserve dirty inputs, including changes made during a slow response. The weekly save records the submitted snapshot only on success; newer input stays dirty and closing the page prompts the browser's unsaved-change warning.

The purchase-status button calls the authenticated, origin-checked `/api/paypal/reconcile` endpoint. It can finish the account's already-approved order after a lost return redirect. Confirmed missing/expired/voided orders can be replaced at the next checkout; stale CREATED orders use PayPal's documented maximum 72-hour extension window. APPROVED and pending captures are never discarded by age or transient errors. Replaced attempts and environment changes are archived atomically with the reset. Request IDs prevent duplicate creation/capture. A purchase whose status remains uncertain is reconciled before another charge is attempted.

Configure production runtime values through Sites environment variables:

- `PAYPAL_CLIENT_ID` and secret `PAYPAL_CLIENT_SECRET`: credentials for the merchant's PayPal REST app.
- `PAYPAL_ENV`: explicitly `sandbox` for tests or `live` for real purchases. Sandbox membership does not carry into live mode.
- `COFFEE_URL`: optional HTTPS donation page; Basket generates its QR locally.
- `COFFEE_QR_IMAGE_URL`: optional HTTPS bank QR image; takes priority over the generated QR.
- `public/bank-qr.jpg`: built-in bank QR fallback when no external QR image is configured. The build embeds public images and serves them without changing their bytes.
- `COFFEE_DETAILS`: optional recipient/bank details shown as plain text.

Do not put credentials in HTML, browser JavaScript or hosting.json. `.env.paypal` and all `.env*` files except `.env.example` are ignored. QR contributions are voluntary and never automatically grant Premium.

Build: `node scripts/build.mjs`. Checks: `npm test` on Node 24 (uses in-memory SQLite and mocked PayPal responses). Sites uses the existing identity headers, provisions `DB`, and applies the schema-only migration under `drizzle/` before deployment. Browser and real PayPal sandbox checkout must still be tested with the merchant's configured account before accepting live payments.
