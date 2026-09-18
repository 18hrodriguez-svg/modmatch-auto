# ModMatch Auto — Supplier/Data Integration Rules

## Goal

Build one normalized automotive catalog while preserving the supplier/manufacturer as the source of truth for fitment, inventory, price, images, warranty, and fulfillment.

## Integration preference order

1. Authorized manufacturer/distributor API.
2. Authorized ACES/PIES/SEMA Data feed.
3. Authorized CSV/SFTP feed.
4. Approved affiliate product feed.
5. Manual catalog entry with written permission.

Do not use unauthorized retailer scraping as the production data source.

## Catalog identity

Prefer manufacturer part number + brand as the canonical product identity. Supplier SKUs belong in supplier_inventory because multiple distributors may sell the same manufacturer part.

## Every product must track

- Brand.
- Manufacturer part number.
- Product name/category.
- Data source.
- Data-rights approval.
- Image-rights approval.
- Fitment source and verification.
- Road-use/emissions status.
- CARB EO number where applicable.
- Warranty source/summary/link.
- Return-policy source.
- Status: draft/review/active/discontinued/blocked.

## Every supplier offer must track

- Supplier SKU.
- Wholesale cost.
- MAP.
- MSRP.
- Quantity/availability state.
- Backorder status.
- ETA.
- Warehouse/location.
- Last sync timestamp.

Never show wholesale_cost in a public browser query.

## Inventory freshness

Customer-facing availability should eventually show:
- In stock / low stock / backorder / out of stock.
- Last checked timestamp.
- ETA when supplier provides one.

Do not say "in stock" indefinitely. Treat stale inventory as unknown.

## Pricing

Selling price must respect:
- Supplier/dealer agreement.
- MAP policy.
- Promotion eligibility.
- Margin floor.
- Shipping cost.
- Payment fees.
- Returns/warranty reserve.
- Tax treatment.

## Warranty

A warranty claim must identify who actually backs it:
- Manufacturer.
- Distributor.
- ModMatch Auto.

Do not display a warranty as manufacturer-backed until authorized reseller/warranty eligibility is confirmed.

## Assets

Download/store supplier/manufacturer assets only when terms permit it. Store source/rights metadata. Do not assume public webpage images are reusable.

## Fitment

Never claim guaranteed fit solely from year/make/model text matching. Use authorized fitment data and preserve qualifiers such as engine, trim, drivetrain, emissions family, bed length, wheel size, transmission, or build date when applicable.

## Sync jobs

Future background sync jobs should:
1. Fetch supplier changes.
2. Validate schema.
3. Stage changes.
4. Flag compliance-sensitive changes.
5. Update prices/inventory.
6. Mark discontinued SKUs.
7. Preserve previous order snapshots.
8. Log source and timestamp.
