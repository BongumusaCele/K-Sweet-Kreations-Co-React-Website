# Backend integration and outstanding production work

The current React implementation is a reviewable frontend preview. It must connect to the planned ASP.NET Core/SQL Server service before it can handle real users, orders, payments or staff access. The preview storage in `src/store.js` is a replaceable development adapter; it is not a secure or persistent backend.

## Required service contracts

| Area            | Operations required                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity        | Registration, sign-in/out, session refresh/revocation, password recovery, current profile, authorised account/role administration                          |
| Catalogue       | Public active products/categories and details; Admin product CRUD, prices, size/servings, options and image management                                     |
| Availability    | Valid collection slots, blocked dates and capacity; authorised slot approval/rescheduling                                                                  |
| Custom requests | Customer-owned request creation, validated/private uploads, request review and manual quotations                                                           |
| Quotations      | Amount/notes, three-day expiry, customer acceptance/decline, revision history and atomic conversion to exactly one order                                   |
| Orders          | Server-priced standard checkout, customer-owned list/detail/history, valid transitions, cancellation requests and Admin decisions                          |
| Payments        | Hosted card payment sessions and verified provider callbacks; EFT proof submission, authorised verification/rejection, deposit/balance ledger and receipts |
| Content         | Bakery contact/WhatsApp configuration, gallery, FAQs, feedback moderation and public approved reviews                                                      |
| Communication   | Enquiries, customer/bakery notifications and retryable background delivery                                                                                 |

Responses need stable IDs, validation errors and concurrency handling. API endpoint names must be agreed with the backend team; this document does not claim that an API already exists.

## Business rules to enforce on the server

- Public browsing; account required for custom quote requests, orders and purchases.
- Customer can access only their own profile, requests, quotes and orders.
- Admin and Staff are distinct roles. Current preview conservatively reserves product management, date blocking, payment verification and feedback publication for Admin. Confirm the final Staff permission matrix before backend implementation.
- Custom cake prices are manually quoted. Quotes expire after three days. Acceptance must create at most one order and must revalidate availability; production should define how reserved quoted dates interact with the seven-day request lead time.
- A custom booking needs approved collection and a verified 50% deposit. Balance due one day before collection. Standard purchases require full payment upfront.
- No handover without full payment. Keep payment state separate from fulfilment state. Failed/repeated callbacks cannot confirm or duplicate orders/payments.
- Collection only. South African local time, 30-minute slots within opening hours, no Sundays, seven-day custom request lead time and Admin-blocked dates. Standard lead time/capacity is still unspecified; the preview currently permits dates from tomorrow, subject to manual approval. Confirm this before release.
- Cancellation/refund and rescheduling are manually reviewed. Cancellation does not automatically refund a payment.
- A ready-for-collection notification failure must not roll back the order update.

## Production controls and content

Replace the preview role selector and simulated account forms with server-issued sessions and server-side access checks. Hash passwords, protect/rotate session tokens, add staff MFA, rate limits, input validation, ownership checks, audit records and secure environment configuration. Protect private images/proofs; validate actual file content as well as extension/MIME, size and count. Client preview accepts JPG/PNG/WebP up to 2 MB; production limits need confirmation.

Replace browser storage with database persistence and protected media storage. Implement transactional stock/availability checks, payment reconciliation and duplicate-event handling. Configure HTTPS, backups, recovery, monitoring and background notifications. Select the payment provider and notification channels, supply bakery-owned banking/contact details and test in staging.

Supply approved products/prices/options/servings, bakery photography/logo, precise collection address, phone/email/WhatsApp, policies and slot capacity. Optional inventory/reporting and account administration require API/data models beyond the original ERD. Kotlin Android remains a separate proposed project using the shared backend.

No automatic refund, delivery, automatic custom pricing, newsletter discount or invented customer reviews are implemented.
