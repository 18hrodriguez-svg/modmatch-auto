# ModMatch Auto — Private supplier dashboard (development)

Route: `/suppliers/` — currently a **development branch only**, not published to production.

## What is implemented
- Existing ModMatch/Supabase customer login is required to view data.
- `supplier_accounts` and `supplier_catalog_products` have per-user row-level security: a signed-in user can only access records they own, and anonymous users receive no table privileges.
- Suggested supplier statuses can be explicitly saved as private records. All default statuses are **unapproved** and editable.
- Add other prospective suppliers.
- Import an **authorized** CSV with name and part number, plus optional manufacturer, category, vehicle year/make/model/engine, cost and hypothetical retail price. Duplicate SKU rows update only within a single supplier.
- On import, every product is stamped as *internal preview*, fitment not verified, data rights not verified, and inventory unknown. No checkout, orders, or public product publishing.
- Search imported catalog rows by SKU, brand and vehicle fields. This is a text/application-field filter, **not guaranteed vehicle compatibility**.
- Trial markup figures are illustrative only, not sellable prices or MAP-compliant pricing.

## Deployment steps
1. Confirm Supabase project is active.
2. Apply migration `supabase/migrations/20261015000100_private_supplier_workspace.sql` after verifying the database backup/production rollout plan.
3. Open the Netlify PR Deploy Preview. Visit `/suppliers/` and sign in with an **existing ModMatch user account**.
4. Select *Save suggested suppliers* once to initialize status tracking.
5. Contact suppliers for reseller eligibility and **written** rights to import product catalog / images.
6. Select supplier, choose an approved CSV, review parsed data, acknowledge authorization, import privately.
7. Validate with test account that one user cannot access another user's records.
8. Do not publish product listings until online resale permission, licensed data/images, authoritative fitment, inventory freshness, MAP, returns and fulfillment, payments and taxes are reviewed.

## Currently pending
- Official dealer status and import rights: Detroit Axle, Atech, Rough Country, Meyer, etc.
- API/feed access, inventory updates, checkout/payments, live order routing.
- Genuine verified ACES/PIES fitment integration, stronger vehicle data and normalized many-to-many fitment.
- Private administrative roles beyond user-owned RLS, bulk imports beyond 1,000 items at a time and pagination beyond 1,500 loaded products.

**Security**: Never store supplier account passwords or API keys in public Next.js client code or GitHub. Any future credentials must live in server-side-only Netlify secrets or trusted backend. Avoid manual scrapes of retailer sites. All prices and supplier data are private; DO NOT merge until verified.
