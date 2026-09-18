import Link from "next/link";

export default function MarketplaceSafetyPage() {
  return (
    <main className="legal-shell">
      <div className="legal-card">
        <Link href="/" className="legal-back">← Back to ModMatch Auto</Link>
        <span className="micro-label">PARTS & MARKETPLACE SAFETY</span>
        <h1>How ModMatch Auto will approve products and shops</h1>
        <p className="legal-updated">Beta policy — September 18, 2026</p>

        <h2>Products are not automatically approved</h2>
        <p>A product should not become publicly sellable merely because a part number, image, or price exists. Our catalog design requires product-status review, compliance review, and documented permission to use supplier/manufacturer data before an item can be exposed as an approved product.</p>

        <h2>California emissions parts</h2>
        <p>For emissions-related aftermarket parts, ModMatch Auto will maintain a road-use status and, when applicable, a CARB Executive Order number. Off-road or competition-only parts must be clearly identified and should not be represented as street legal.</p>

        <h2>Inventory</h2>
        <p>Supplier inventory is treated as time-sensitive data. Future customer availability displays will include a sync timestamp or equivalent freshness indicator. Wholesale cost data is private and is not exposed through public catalog access.</p>

        <h2>Warranty and returns</h2>
        <p>Warranty and return information must be tied to an identified source such as the manufacturer, authorized supplier, or ModMatch Auto. We will not promise a manufacturer warranty until the applicable authorized-reseller and warranty terms are confirmed.</p>

        <h2>Product images and data</h2>
        <p>Product images, specifications, descriptions, videos, manuals, and fitment data must come from an authorized source or be independently created with the necessary rights. ModMatch Auto should not build its catalog by copying or scraping third-party retailer content without permission.</p>

        <h2>Shop verification</h2>
        <p>Shops can create private beta profiles, but public discovery is designed to require verification status. California repair businesses may be asked for applicable Bureau of Automotive Repair registration and other business/insurance information before public marketplace visibility.</p>

        <h2>Labor estimates</h2>
        <p>Labor hours can originate from shop-entered times, a licensed labor guide, or a custom quote. Estimated time and price are not final authorization for repair work. The shop remains responsible for required estimates, authorizations, invoices, and repair-law compliance.</p>

        <h2>Marketplace launch gate</h2>
        <p>Paid third-party marketplace selling will remain behind a launch gate until seller verification, payment processing, tax handling, returns, warranty workflow, fraud controls, and applicable marketplace-law requirements are ready.</p>
      </div>
    </main>
  );
}
