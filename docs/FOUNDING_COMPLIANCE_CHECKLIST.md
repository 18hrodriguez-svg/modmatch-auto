# ModMatch Auto — Founder & Compliance Launch Checklist

Last updated: 2026-09-18

This document is an operating checklist for the beta. It is not a substitute for advice from a California business attorney, CPA, insurance broker, or other licensed professional.

## Current stage

- Product beta is live at modmatchauto.com.
- Customer accounts, garages, builds, budgets, feedback, and shop beta onboarding exist.
- Paid checkout is NOT a launch requirement yet.
- Public shop discovery must stay verification-gated.
- Product catalog must stay compliance/data-rights gated.

## Phase 1 — Beta before taking money

- [x] Keep GitHub source private.
- [x] Separate customer data from shop data.
- [x] Require RLS access controls in Supabase.
- [x] Add Beta Terms and Privacy Notice.
- [x] Version account legal consent.
- [x] Add product compliance/data-rights gates.
- [x] Add shop verification status.
- [x] Prevent wholesale cost from public client access.
- [ ] Create support@modmatchauto.com and privacy@modmatchauto.com mailboxes/forwards.
- [ ] Decide whether to stay pre-entity through 2026 or form earlier for a supplier requirement.
- [ ] Get 25–50 beta users and 5–10 shop conversations.
- [ ] Do not enable product checkout yet.
- [ ] Do not scrape retailer images/descriptions into the production catalog.

## Phase 2 — Before first commercial part sale

- [ ] Form legal entity (recommended California LLC for initial operating stage unless counsel/tax advice says otherwise).
- [ ] Get EIN from IRS after entity formation.
- [ ] File required California Statement of Information.
- [ ] Open dedicated business checking account.
- [ ] Obtain California seller's permit through CDTFA.
- [ ] Obtain Anaheim business license if business is conducted from/in Anaheim.
- [ ] Obtain general liability + product liability + cyber/E&O insurance quotes.
- [ ] Have attorney review Terms, Privacy, Returns, Warranty, Marketplace Terms, supplier contracts, and limitation-of-liability language.
- [ ] Set up bookkeeping and sales-tax workflow.
- [ ] Connect payment processor only after legal entity/bank setup.
- [ ] Test order, cancellation, refund, partial shipment, backorder, and chargeback workflows.

## Phase 3 — Supplier approval

For each supplier/distributor/brand, record:

- [ ] Written approval / dealer agreement.
- [ ] Authorized reseller status.
- [ ] Resale certificate submitted.
- [ ] API/feed credentials stored server-side only.
- [ ] Permission to use product descriptions/specifications.
- [ ] Permission to use/download product photography.
- [ ] MAP policy documented.
- [ ] Warranty flow documented.
- [ ] Return/RMA flow documented.
- [ ] Inventory freshness/SLA documented.
- [ ] Shipping/fulfillment method documented.
- [ ] California emissions restrictions documented.
- [ ] Supplier contact for disputes/data errors documented.

Do not make products publicly sellable until data_rights_verified and compliance_status are approved.

## Phase 4 — California automotive compliance

- [ ] For emissions-related aftermarket products, store road-use status.
- [ ] Store applicable CARB Executive Order number when required.
- [ ] Clearly distinguish 50-state, CARB-EO, off-road-only, and race-only products.
- [ ] Do not advertise off-road/race-only products as street legal.
- [ ] Before public shop discovery in California, verify applicable Bureau of Automotive Repair registration.
- [ ] Maintain a process for suspending expired/revoked shop profiles.
- [ ] Do not represent ModMatch labor estimates as final repair authorization.
- [ ] Shops remain responsible for legally required estimates, authorizations, invoices, and repair documentation.

## Phase 5 — Marketplace seller compliance

If ModMatch allows third-party sellers to sell through the platform:

- [ ] Review INFORM Consumers Act applicability before launch.
- [ ] Use a payment/KYC provider for seller identity, tax, and bank verification rather than storing bank/tax IDs in the browser database.
- [ ] Track seller volume/revenue thresholds.
- [ ] Build seller verification and annual re-certification.
- [ ] Build required seller disclosures where applicable.
- [ ] Build suspicious-activity reporting.
- [ ] Build seller suspension workflow.
- [ ] Create counterfeit/stolen/unsafe product reporting and removal process.

## Phase 6 — Customer privacy & safety

- [ ] Customer home street address is not required for basic account creation.
- [ ] Use ZIP/city or optional location for nearby shops.
- [ ] Request exact location/address only when needed for shipping/mobile service/appointment.
- [ ] Add account data export/delete/correct workflows before scale.
- [ ] Do not target children under 13.
- [ ] Review CCPA/CPRA applicability as company grows.
- [ ] Keep secrets/API keys out of client code unless specifically designed as public publishable keys.
- [ ] Add audit logging for admin/catalog changes before staff access expands.

## Phase 7 — Before native app stores

- [ ] Ship PWA first.
- [ ] Privacy policy includes mobile permissions.
- [ ] Explain camera/location/notifications before requesting OS permission.
- [ ] Add native value beyond a simple website wrapper.
- [ ] Apple Developer account.
- [ ] Google Play developer account.
- [ ] App privacy disclosures match actual data collection.

## High-risk actions that require review before enabling

- Product checkout.
- Third-party seller payouts.
- Shop public verification badges.
- "Guaranteed fit" language.
- "Street legal" claims.
- "Manufacturer warranty included" claims.
- Exact labor-time guarantees.
- User-generated public reviews.
- Financing / buy-now-pay-later.
- International taxes/customs.
- Storing government IDs, tax IDs, or bank details.
