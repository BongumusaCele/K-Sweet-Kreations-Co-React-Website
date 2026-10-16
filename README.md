# K Sweet Kreations Co website

React 19 / Vite storefront with authenticated Customer, Staff and Admin workflows backed by the sibling ASP.NET Core API. Products, accounts, requests, quotations, orders, payments, enquiries, feedback and blocked collection dates are persisted by the API. There is no preview role switch, simulated sign-in or local-storage database.

## Local development

1. Follow the backend repository's README to configure secrets and apply its SQL Server migrations. Start the API on `http://localhost:5088` using the `http` launch profile.
2. In this repository, run `npm ci`, then `npm run dev` with Node.js 24.
3. Open the Vite URL. The development server proxies `/api` and `/uploads` to the backend. Copy `.env.example` to `.env.local` to change the target.

Register a Customer account through the website. Sign in with the configured Admin account to open the bakery workspace and create Staff accounts or products. An empty database displays an empty catalogue until Admin adds products. Staff can review requests, issue manual quotations, approve collection times, progress orders and handle enquiries. Product management, payment verification, blocked dates, feedback publication and Staff-account creation require Admin.

## Workflows and failures

- Standard checkout sends product IDs and quantities. The API calculates prices and validates availability and collection details. Full EFT payment and collection approval are required before confirmation.
- Custom requests use manual quotations valid for three days. Acceptance creates one order. Verified 50% deposit and approved collection confirm a booking; the balance is due one day before collection. Handover requires full payment.
- Submit JPG/PNG/WebP inspiration images and EFT proofs up to 2 MB. The server validates file signatures. Private images/proofs require authentication and ownership or bakery permissions.
- Forms show validation and API errors, preserve failed input and prevent duplicate clicks. Stable submission IDs protect order/request retries. Network failures, timeouts, permission failures, expired sessions and rate limits have readable messages. A failed refresh after a successful save is reported separately so the UI does not ask the user to submit a saved record again.
- Sessions use an HTTP-only cookie. Tokens and customer records are not stored in browser storage. Sign-out revokes the server session. Reloading restores a valid account from the API.

EFT is the implemented payment method. Supply bakery-owned banking/contact details operationally; the application does not invent them. Card gateways, automatic bank reconciliation, email/SMS/WhatsApp delivery and password-recovery email are not configured. Unavailable controls are not presented as successful operations.

## Checks

```sh
npm run lint
npm test
npm run format:check
npm run build
npm run test:e2e
```

Browser tests use explicit API fixtures to test rendering and failure handling. To run the real HTTP/database/browser suite with both repositories checked out beside each other:

```sh
dotnet build ../K-Sweet-Kreations-Co-Web-API/K-Sweet-Kreations-Co-Backend-API.slnx
npm run test:integration
```

The integration runner starts an isolated ASP.NET Core process with a disposable SQLite database, random signing key and test-only Admin credentials. It never uses the real SQL Server connection. The suite covers server-priced checkout, private proofs, roles/ownership, duplicate acceptance and submission, payment verification, unpaid-handover guards, registration/profile persistence, feedback moderation and blocked dates. SQL Server migrations must also be validated against the deployment database.

## Hosting

Use HTTPS and serve the frontend and `/api` from the same origin, or from same-site subdomains with explicit credentialed CORS origins configured on the API. The cookie deliberately uses `SameSite=Strict`; a standalone GitHub Pages domain talking to an unrelated API domain is not a supported authenticated deployment.

For a single ASP.NET Core host, build the frontend and copy the contents of `dist/` into the API's `wwwroot/` before publishing the API. Preserve its `wwwroot/uploads/` media directory. The API serves the root `index.html`; hash navigation supports page reloads. Alternatively configure an HTTPS reverse proxy for `/api` and `/uploads`. Use persistent storage for uploads and configure the SQL Server connection and JWT key through the hosting secret store.

CI checks and packages the build; automatic GitHub Pages publishing has been removed because the website now needs its backend. `VITE_BASE_PATH` remains available for subpath asset builds. `npm run test:pages` verifies asset paths after building with `/K-Sweet-Kreations-Co-React-Website/`.

See [API contracts and configuration](docs/backend-integration.md) for the integration boundary. Repository branching and commit conventions are in [AGENTS.md](AGENTS.md).
