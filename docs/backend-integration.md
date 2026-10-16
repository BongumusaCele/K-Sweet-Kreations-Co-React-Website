# Website API integration

The website uses the ASP.NET Core API in the sibling `K-Sweet-Kreations-Co-Web-API` checkout. The development proxy forwards `/api` and `/uploads` to port 5088. The public API base defaults to `/api`; override `VITE_API_URL` at build time only when using a configured same-site API origin.

## Identity

| Method    | Path                 | Purpose                                                                            |
| --------- | -------------------- | ---------------------------------------------------------------------------------- |
| POST      | `/api/Auth/register` | Customer registration with fullName, email, phoneNumber, password, confirmPassword |
| POST      | `/api/Auth/login`    | Email/password sign-in; sets HTTP-only session cookie                              |
| GET / PUT | `/api/Auth/me`       | Current account / save name and phone                                              |
| POST      | `/api/Auth/logout`   | Revoke session and clear cookie                                                    |
| POST      | `/api/Auth/staff`    | Admin creates Staff account                                                        |

The frontend uses `credentials: include`, never reads the JWT, and restores account identity through `/Auth/me`. The API validates session revocation, expiry, active-account state and current role on each authenticated request. Cookies are secure outside Development/Testing; HTTPS must reach the API correctly through any hosting proxy. Configure forwarded headers only for the deployment's trusted proxies.

## Website contract

`GET /api/website` returns catalogue, blocked dates and published feedback to anonymous users. Customers additionally receive only their own requests and orders. Admin/Staff receive bakery operational records. The server constructs response DTOs rather than returning tracked account entities or password hashes.

Admin additionally receives `customers` and `staff` account directories, including accounts with no orders or requests. Other roles receive empty directory arrays. Shared records refresh after saves, on navigation, on window focus or reconnection, and every 30 seconds while the page is visible and online. Failed refreshes retain existing records and show a retry message.

All mutations are explicit API operations; there is no endpoint accepting a replacement browser store.

| Method       | Website path                  | Access                                                                 |
| ------------ | ----------------------------- | ---------------------------------------------------------------------- |
| POST         | `/orders`                     | Customer; contact, collection, product IDs/quantities and submissionId |
| POST         | `/requests`                   | Customer; multipart request fields, submissionId, optional image file  |
| POST         | `/requests/{id}/quote`        | Admin/Staff; amount and notes                                          |
| PATCH        | `/requests/{id}/status`       | Admin/Staff; Under review / Declined                                   |
| POST         | `/requests/{id}/respond`      | Owning Customer; Accepted / Declined                                   |
| POST         | `/orders/{id}/approve-slot`   | Admin/Staff                                                            |
| PATCH        | `/orders/{id}/status`         | Admin/Staff; sequential progress, Admin-only cancellation              |
| POST         | `/orders/{id}/cancel`         | Owning Customer; request cancellation                                  |
| POST         | `/orders/{id}/proof`          | Owning Customer; multipart reference and image file                    |
| PATCH        | `/payments/{id}/verify`       | Admin; Verified / Rejected                                             |
| GET          | `/payments/{id}/proof`        | Owning Customer or Admin/Staff                                         |
| POST / PUT   | `/products`, `/products/{id}` | Admin                                                                  |
| PUT / DELETE | `/blocked/{yyyy-MM-dd}`       | Admin                                                                  |
| POST         | `/enquiries`                  | Public                                                                 |
| PATCH        | `/enquiries/{id}/status`      | Admin/Staff                                                            |
| POST         | `/reviews`                    | Customer                                                               |
| PATCH        | `/reviews/{id}/status`        | Admin; Published / Hidden                                              |

Paths in this table are relative to `/api/website`. Add/Edit Product uses multipart `POST /products/upload` or `PUT /products/{id}/upload`, with the product fields and an optional JPG/PNG/WebP `file` up to 2 MB. Editing without a file preserves the existing photograph. Numeric prices use a dot decimal separator regardless of server locale. The existing JSON product endpoints and Admin-only `/api/ProductImages/upload` remain available for API clients. Private inspiration images use `/api/CustomCakeImages/{id}/file`.

EFT proofs accept PDF/JPG/PNG/WebP files up to 5 MB. The API checks the actual file signature as well as extension and size. Proof downloads require the owning Customer or Admin/Staff session; PDFs download as attachments. Azure uploads use private Blob containers through the API, with stable website media URLs and no storage credentials in frontend code.

Order/request submissions use a stable UUID. Retrying the same payload reuses the saved submission; changing details under an already saved UUID returns a conflict. Mutations use serializable database transactions, and database uniqueness protects quotation/request conversion and bank references. Payment states are derived from verified payments independently of order progress. Order changes record account IDs in status-history notes.

Errors are ASP.NET validation problem responses or JSON problem/message responses. The client handles 400/401/403/404/409/413/429, timeouts and network errors. Private responses use `Cache-Control: no-store`. Forms retain input on failure and only display success after the API accepts a mutation.

## Migration and deployment

Admin can confirm deletion from the Products list via `DELETE /api/website/products/{id}`. The product disappears from all catalogue snapshots and cannot be purchased, edited or assigned new photographs. Deletion is idempotent and preserves the database row and existing media for historical orders. Staff and Customer requests are forbidden. Apply the `ProductDeletion` migration before deploying this API version; it adds a nullable deletion date without changing existing products.

Apply the backend's `WebsiteIntegration` and `RetrySafeSubmissions` migrations before starting this frontend against an existing database. They add website fields, reviews, blocked dates, submission receipts and uniqueness constraints, rename the stored Consultant role to Staff, and align historical statuses. Historical duplicate bank references or multiple orders for one request cause a migration failure with a review instruction rather than silent deletion. Existing payment-stage orders return to Awaiting confirmation and require collection approval; payment records retain their amounts and verification states.

The older Products, Enquiries, CustomCakeRequest, Quotations, CustomerOrders and Payments controller classes are marked `NonController` and no longer expose the incompatible HTTP contract. They remain temporarily for historical regression tests. Consumers of the former endpoints must move to the routes above. Historical ConsultantId database column names are retained to preserve relationships; the active application role is Staff.

Keep production SQL Server, signing keys and uploaded media outside disposable build outputs. Set exact CORS origins when needed; wildcard credentialed CORS is not used. Request/identity rate limits are configurable. The Testing environment creates a disposable SQLite schema only for automated tests and must not be used for deployment.

Payment-provider callbacks, automated notifications, password-recovery email, staff MFA, quantitative slot capacity and bakery-approved content are separate launch configuration/development items. No automatic refund or delivery workflow is implemented.
