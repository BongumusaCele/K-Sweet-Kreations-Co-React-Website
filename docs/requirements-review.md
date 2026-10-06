# K Sweet Kreations Co requirements review

Source: `XADAD7112_Group 13_Task 1 (1).docx`, supplied on 6 October 2026. The historical name The Sweet Table Co. means **K Sweet Kreations Co** in this project. This review records requirements and unresolved differences; it does not authorize implementation or external actions. Visual design will be supplied separately by the user.

## Business workflow

The bakery specialises in custom/novelty cakes, cupcakes and desserts. The main objective is to reduce repeated communication by capturing complete requirements in one request and explaining cake sizes, servings and starting prices clearly.

The documented customer process is: submit requirements, bakery reviews and quotes, customer accepts, collection is confirmed, customer pays a 50% deposit and supplies proof, bakery prepares the order, remaining balance is paid one day before collection, customer collects. A request is distinct from an accepted quotation and a confirmed order. Custom cake final prices require bakery review in sections 4, 5 and 13; automatic pricing appears elsewhere and remains unresolved.

Collection only: no delivery addresses, delivery fees or delivery management under FR26 and sections 4.4 and 10.2. Hours recorded in the document are Monday–Friday 09:00–17:00, Saturday 09:00–15:00, closed Sunday, in South Africa. Location is Lenasia South, Migson Manor. Late fees are mentioned but their rules are not defined. Current business details should be reconfirmed before publication.

## Functional requirement register

| ID | Requirement | Priority |
| --- | --- | --- |
| FR01 | Business and bakery service information | Must |
| FR02 | Display cakes, cupcakes and desserts | Must |
| FR03 | Product images, starting prices and relevant details | Must |
| FR04 | Cake sizes and associated serving counts | Must |
| FR05 | Select cake size | Must |
| FR06 | Select flavour | Must |
| FR07 | Select available filling | Must |
| FR08 | Upload inspiration image | Must |
| FR09 | Enter customisation comments, changes and special instructions | Must |
| FR10 | Select preferred collection date | Must |
| FR11 | Select preferred collection time within permitted hours | Must |
| FR12 | Capture customer details, including name and contact number | Must |
| FR13 | Submit completed custom cake selections as a quote request | Must |
| FR14 | Bakery views and reviews submitted requests before final quotation | Must |
| FR15 | Authorised bakery users view customer and order information | Must |
| FR16 | Support 50% deposit and remaining balance payment process | Must |
| FR17 | Authorised bakery users update order status | Should |
| FR18 | Customers view their order progress/status | Should |
| FR19 | Request, payment, collection-readiness and completion notifications | Should |
| FR20 | Authorised users manage displayed products | Must |
| FR21 | Submit general customer enquiries | Must |
| FR22 | Gallery of previous bakery work | Should |
| FR23 | Frequently asked questions | Should |
| FR24 | Customer reviews or feedback area | Should |
| FR25 | Convenient WhatsApp contact for enquiries/quotations | Should |
| FR26 | Clearly reflect collection-only fulfilment | Must |

## Additional features described outside the FR table

Sections 6, 7, 10 and 12 also describe standard catalogue orders, product details, categories/search, quantities, cart add/remove, price summaries, checkout, unique order references and confirmation. Checkout captures contact details, collection selection, instructions and payment method. Card gateway and EFT with proof upload/authorised verification are proposed; provider is not selected. Custom cupcake configuration is listed in scope but its options are undefined.

Quotation management includes review, clarification or rejection of infeasible designs, amount and notes, validity/expiry, revisions and customer acceptance. An accepted custom quotation can create one order; standard orders need not have a quotation. Starting prices and estimates must not be presented as approved custom final prices.

Protected administration includes product add/edit/remove, prices, availability, product images, custom requests, enquiries, customer/order details, payment visibility, status history and basic sales summaries. Later sections additionally describe inventory, customer account management, reports, audit records, manager approvals and administrator account management. These additions lack the same explicit FR priorities and need reconciliation with the earlier owner/staff model.

Registration, login, password recovery, profile management and current/previous orders appear in the ERD and development plan. Earlier design sections explicitly leave accounts versus guest checkout undecided. Public order tracking is described as reference plus identity verification, with safe errors for unknown/mismatched references and no unrelated customer data.

The five core documented statuses are Order Received, Payment Confirmed, Order In Progress, Ready for Collection and Order Completed. UML adds Payment Pending and Cancelled, while ERD wording includes Order Confirmed and Collected. Names, transitions, cancellation/expiry and deposit-versus-full-payment implications are not final.

## Non-functional requirement register

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR01 | Easy navigation and understandable custom cake builder | Must |
| NFR02 | Clear, readable sizes, servings, prices and ordering instructions | Must |
| NFR03 | Responsive desktop, tablet and mobile experience | Must |
| NFR04 | Reasonable page loads and action response times | Should |
| NFR05 | Protect customer details, uploads and orders from unauthorised access | Must |
| NFR06 | Restricted access and legitimate use of customer information | Must |
| NFR07 | Reliable operation and protection against lost requests/orders | Must |
| NFR08 | Availability for browsing, enquiries and requests | Should |
| NFR09 | Maintainable code and authorised content updates | Should |
| NFR10 | Support growth in products, customers and orders | Should |
| NFR11 | Compatibility with modern browsers | Should |
| NFR12 | Consistent modern, elegant visual design | Should |

Security design additionally calls for HTTPS, server-enforced role and ownership checks, password hashing, staff MFA, input/file type and size validation, rate limits, parameterised queries, session expiry/revocation, hashed refresh tokens, secure secrets, protected media, sensitive-data protection and tamper-resistant audits. Card details are handled by the provider and are not stored by the application. Trusted payment outcomes or authorised EFT verification determine payment state.

Performance/operations proposals include image optimisation, pagination, indexed queries, connection pooling, catalogue caching with invalidation, background notifications/reports/image processing, logs and monitoring, environment separation, backups and recovery testing. Numerical performance, availability, retention and upload limits are not specified.

## Architecture and data

The proposed stack is React website, ASP.NET Core backend APIs, SQL Server database and Azure hosting; a separate Kotlin Android application shares backend services and data. The current repository is the React website. The mobile app/backend proposals do not themselves expand the user's current request into building those projects.

Layered architecture separates presentation, business services, repositories, media storage and integrations. A modular monolith is proposed, with shared server-side business rules. Supporting patterns include MVC, Service Layer, Repository, Dependency Injection, Strategy, Factory and Observer/Publish-Subscribe.

ERD entities: USERACCOUNT, USERSESSION, PRODUCT, PRODUCTIMAGE, CUSTOMCAKEREQUEST, CUSTOMCAKEIMAGE, QUOTATION, CUSTOMERORDER, ORDERITEM, PAYMENT, ORDERSTATUSHISTORY and ENQUIRY. They cover account roles/sessions, product details and gallery images, customer requests and multiple inspiration images, revised quotations, standard/custom orders with items, multiple payment attempts, status history and enquiries. An accepted quote maps to at most one order. Each order has at least one item and status history entry.

Additional request attributes include email, event date, colour, servings, shape, theme, cake message and budget; their required/optional status is undefined. The request schema lacks preferred collection time despite FR11. Reviews, inventory, cake option/price definitions, notification records, manager permissions and audit logs need data modelling beyond the listed ERD. The class diagram's single payment association also differs from the ERD's multiple payment attempts; deposits and balances require multiple payment records.

## Testing and delivery expectations

The ten documented test cases cover cart add/remove, quotation calculations, customisation capture, valid upload, valid order submission, invalid-order feedback, status update, product management and payment confirmation. Calculation expectations must be reconciled with manual custom quoting before implementation.

Further acceptance scenarios require that customers cannot access others' orders, administrators cannot perform manager-only actions, invalid/duplicate payments do not confirm orders, unavailable products cannot be purchased, stock/totals remain accurate and failed notifications do not fail an order transaction.

Testing includes unit, integration, interface, security, performance, browser/device compatibility, regression and client UAT. GitHub Actions, meaningful commit/branch history, test evidence, staging validation, deployment documentation, user guidance and handover are proposed. Main/develop/feature/test branching and the six commit prefixes already match repository guidance.

The document's baseline target is 6 November 2026; later material uses an illustrative ten-week schedule. Historical milestone statuses are planning evidence, not evidence of actual completed development.

## Decisions to resolve before affected implementation

1. **Role names confirmed by user on 6 October 2026:** use Admin, Staff and Customer as the application roles. Do not introduce separate Manager or Consultant roles. Working permission interpretation: Admin manages products, accounts/roles and bakery operations; Staff handles assigned operational work such as reviewing requests, preparing manual quotations and updating orders; Customer browses, submits requests and accesses only their own customer records. Exact Staff permissions, including product edits, payment verification and quotation approval, still need definition before implementing those protected actions. Server-side role and resource-ownership checks remain required. Historical Manager/Consultant responsibilities must be mapped to these roles rather than creating extra roles.
2. **Customisation and pricing confirmed by user on 6 October 2026:** keep cake customisation as simple as possible for this release and use manual custom quotations. Use a straightforward request form capturing customer details, size, flavour, filling, inspiration image, comments and preferred collection date/time. The bakery reviews the request and supplies the quotation. Do not implement automatic custom-cake pricing, estimates, a visual cake designer or advanced configuration in this release. Additional request fields proposed in the ERD are not automatically required; add only where needed and agreed. Displayed catalogue starting prices remain informational and are not a final custom quotation.
3. **Fulfilment confirmed by user on 6 October 2026:** collection only for the current scope. Do not implement delivery selection, delivery addresses, delivery fees or delivery management. Later document references to delivery do not apply to this release. Delivery may be considered in a future scope change.
4. **Accounts confirmed by user on 6 October 2026:** customers can browse products without an account. Registration/login is required to submit a custom quotation request, place an order or purchase; guest checkout is not supported. Customer accounts provide access to their own requests, quotations, order tracking, historical orders and account/profile management. Enforce ownership on the server. Allow browsing before prompting for sign-in at submission/ordering/purchasing.
5. **Payments:** the user approved the payment rules below on 6 October 2026. Card provider, EFT banking instructions, receipt details and technical handling of failed/duplicate transactions still require implementation decisions.
6. **Collection:** the user approved the collection rules below on 6 October 2026. Numeric slot capacity, standard-product lead time and actual blocked/holiday dates remain to be supplied. The seven-day custom lead time should be validated with the bakery before launch.
7. **Statuses:** the user approved the separate quotation, payment and order states below on 6 October 2026. Exact staff permissions and transition guards must follow the approved business sequence.
8. **Expanded modules:** confirm inventory, reports, manager approvals, discounts and consultant assignment; they appear in later design material without complete business rules.
9. **Content:** supply current contact/social details, precise collection address, product list, sizes/servings, flavours/fillings, prices, images, FAQs, policies and review moderation/submission rules.
10. **Uploads/notifications:** define allowed types, sizes/counts, storage/retention, email/SMS/WhatsApp channels and recipients/triggers. A WhatsApp contact link is distinct from automated WhatsApp messaging.
11. **Platform boundaries:** confirm backend/API ownership and whether Android is a separate team deliverable; align website contracts with the backend.
12. **Design and acceptance:** await user-supplied design; define measurable quality targets and current schedule before treating recommendations as approved rules.

## Approved first-release order rules

The user accepted the proposed rules on 6 October 2026. These decisions supersede conflicting suggestions in the planning document.

### Quotation and order workflow

- Keep quotation state, payment state and fulfilment/order state separate. An order can be In progress while its balance is still outstanding.
- Custom quotation states: Submitted, Under review, Quoted, Accepted, Declined and Expired.
- Payment summary states: Awaiting payment, Deposit paid and Fully paid. EFT proof awaiting verification is not a confirmed payment. Payment attempts can separately record failure or cancellation without treating the order as paid.
- Order states: Awaiting confirmation, Confirmed, In progress, Ready for collection, Collected and Cancelled.
- A customer signs in and submits a simple custom cake request. Admin or Staff reviews the design and requested collection time and sends a manual quote. No automatic custom price calculation.
- Quote validity is three days, with expiry clearly displayed. Payment/booking after expiry requires bakery review rather than silently accepting the expired offer.
- Customer accepts the quote and pays a 50% deposit. The booking becomes Confirmed only after the bakery approves the collection slot and the deposit is verified.
- Remaining 50% is due one day before collection. Preparation can be In progress before full payment, but handover requires the order to be Fully paid.
- Standard catalogue purchases require full payment upfront. Collection availability still needs validation before accepting the purchase.
- Staff marks completed preparation Ready for collection, then Collected after handover.

### Collection

- Collection only, using South African local time.
- Custom cakes have a minimum seven-day lead time, to be checked with the bakery before launch.
- Offer 30-minute collection slots within Monday–Friday 09:00–17:00 and Saturday 09:00–15:00. No Sunday slots; slot intervals must fit within opening hours.
- Admin can block closed or fully booked dates. The requested slot is provisional until bakery approval and verified deposit for a custom cake.
- Rescheduling is handled through Staff or Admin. Changes must respect availability and lead time.
- Handle late arrivals manually; do not calculate automatic late fees in this release.

### Payment verification and cancellations

- EFT proof uploads remain Awaiting verification until authorised staff confirms receipt of funds.
- Card payment confirmation comes from a verified server-side payment-provider notification, not a browser redirect or customer claim. Repeated payment notifications must not double-count funds or duplicate confirmed orders.
- Show paid amount, outstanding balance and relevant due date in the customer's account.
- No order handover until fully paid.
- Customers may request cancellation. Admin reviews cancellations of paid orders and handles refunds manually; no automatic refund or assumed non-refundable-deposit rule is approved.

No application features were implemented as part of this review. The approved rules form the baseline for implementation after the design is supplied.
