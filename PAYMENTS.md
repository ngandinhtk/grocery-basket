Basket Premium costs USD 3.00 once (reference price USD 18). PayPal creates and captures orders on the server. An approved or pending order never grants access. A completed USD 3.00 capture is bound to the signed-in Sites user and persisted in D1. Repeated capture requests reconcile the original order instead of charging again. Capture status is rechecked at most five minutes apart; refunded or reversed purchases lose access.

Premium currently provides account-owned shopping templates and a seven-day meal plan. Existing grocery lists, budget tracking, editing, and built-in templates remain free. Saved templates are capped at 100 per account and 200 ingredients per template. The grocery list itself stays on the current device.

Configure production runtime values through Sites environment variables:

- `PAYPAL_CLIENT_ID` and secret `PAYPAL_CLIENT_SECRET`: credentials for the merchant's PayPal REST app.
- `PAYPAL_ENV`: explicitly `sandbox` for tests or `live` for real purchases. Sandbox membership does not carry into live mode.
- `COFFEE_URL`: optional HTTPS donation page; Basket generates its QR locally.
- `COFFEE_QR_IMAGE_URL`: optional HTTPS bank QR image; takes priority over the generated QR.
- `public/bank-qr.jpg`: built-in bank QR fallback when no external QR image is configured. The build embeds public images and serves them without changing their bytes.
- `COFFEE_DETAILS`: optional recipient/bank details shown as plain text.

Do not put credentials in HTML, browser JavaScript or hosting.json. `.env.paypal` and all `.env*` files except `.env.example` are ignored. QR contributions are voluntary and never automatically grant Premium.

Build: `node scripts/build.mjs`. Checks: `npm test` on Node 24 (uses in-memory SQLite and mocked PayPal responses). Sites uses the existing identity headers, provisions `DB`, and applies the schema-only migration under `drizzle/` before deployment. Browser and real PayPal sandbox checkout must still be tested with the merchant's configured account before accepting live payments.
