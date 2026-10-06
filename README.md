# K Sweet Kreations Co

React website preview following the supplied bakery design and approved requirements. The customer storefront and Admin/Staff workspace use the same pink/lilac and deep-purple visual style.

## Run locally

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Use the **View as** selector to preview Customer, Admin or Staff. For the customer account preview, use `customer@example.com` and any sample password of at least eight characters. No password is saved or verified, and no real account is created.

## Included interfaces

- Home, catalogue/search/categories/sorting, product details, gallery, bakery information, FAQs, contact/enquiries and moderated feedback.
- Cart, account forms/profile, collection checkout, simple custom cake request with inspiration upload, manual quote acceptance and order history/tracking.
- Admin/Staff dashboard, request review/manual quoting, order progress, collection diary, enquiries and feedback review.
- Admin product availability/management, date blocking, payment-proof verification preview and customer directory.

## Preview boundary

This repository currently contains the frontend, not an ASP.NET Core backend. Orders, quotes, enquiries, uploaded sample images and feedback are stored in this browser’s local storage under `ksk-preview-v1`. Customer sign-in is held in memory. Use sample details only. Clear that local-storage key to reset the workspace.

The visible role selector is a preview tool, not authentication or authorisation. Customer records are filtered in the UI to demonstrate ownership, but that does not protect data. Card payment is unavailable, EFT verification is simulated, and no email, SMS or WhatsApp messages are sent. Password recovery and account/role administration require the identity service. Contact details and payment-provider/banking information have not been supplied.

Do not use this preview for real orders or personal data. See [backend integration](docs/backend-integration.md) for the remaining production work and [requirements review](docs/requirements-review.md) for agreed business rules.

Sample products, prices, cake options and stock photography must be replaced/approved by the bakery. No real testimonials, promotions or contact details are invented.

## Checks

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run format:check
```

`npm run preview` serves the generated `dist/` build. Browser tests cover catalogue/cart, account gates, quote-to-order workflow, payment/collection guards, ownership preview, staff restrictions, feedback moderation and responsive layouts. GitHub Actions runs format, lint, unit tests, build and browser tests when `develop` is updated on GitHub, including when a feature branch is merged into it. A local merge triggers the workflow only after it is pushed. Feature-branch pushes and opening pull requests do not trigger this workflow. After every check passes, the same workflow publishes the verified build to GitHub Pages.

## Branches and commits

Start each `feature/<name>` or `test/<name>` from `develop`, commit and push independently, then integrate verified work into `develop`. `main` remains the tested release branch. Use `feat`, `fix`, `test`, `docs`, `refactor` and `style` prefixes. See [AGENTS.md](AGENTS.md).

## Client preview hosting

Preview URL: https://bongumusacele.github.io/K-Sweet-Kreations-Co-React-Website/

The workflow runs only when `develop` is updated on GitHub. It runs formatting, lint, unit tests, production build, browser workflows and a smoke test under the repository URL path. The deploy job depends on successful verification and publishes the exact `dist/` artifact to GitHub Pages. Older in-progress runs are cancelled when a newer develop update arrives. `main` is not automatically published.

GitHub Pages uses the GitHub Actions publishing source. The production build receives `VITE_BASE_PATH=/K-Sweet-Kreations-Co-React-Website/`; local development still uses `/`. Images stored in preview records are resolved through `src/assets.js` so both URLs work. Hash navigation supports client routes and reloads on static hosting.

To verify the repository-hosted build locally in PowerShell:

```powershell
$env:VITE_BASE_PATH='/K-Sweet-Kreations-Co-React-Website/'
npm run build
Remove-Item Env:VITE_BASE_PATH
npm run test:pages
```

GitHub Pages publishes only the frontend preview. Each browser has its own sample records. The client can review Customer, Admin and Staff screens using the preview selector, but no real account, order, payment or notification is created. Use sample details only.
