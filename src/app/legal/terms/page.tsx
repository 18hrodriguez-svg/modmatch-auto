import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="legal-shell">
      <div className="legal-card">
        <Link href="/" className="legal-back">← Back to ModMatch Auto</Link>
        <span className="micro-label">BETA TERMS OF USE</span>
        <h1>Terms of Use</h1>
        <p className="legal-updated">Effective September 18, 2026</p>

        <h2>1. Beta platform</h2>
        <p>ModMatch Auto is currently a beta planning and discovery platform. Features, pricing tools, fitment information, shop listings, labor estimates, availability, and integrations may change as the product develops.</p>

        <h2>2. Vehicle, fitment, and labor information</h2>
        <p>Vehicle fitment, installation time, labor estimates, pricing, availability, and modification information are planning references unless a verified supplier, manufacturer, or shop expressly confirms them. Users should verify exact compatibility, specifications, legal compliance, warranty coverage, and installation requirements before purchasing or installing any part.</p>

        <h2>3. Shops and service providers</h2>
        <p>Independent repair shops, mobile mechanics, dealers, installers, suppliers, and other businesses are separate businesses. A profile or listing on ModMatch Auto is not a guarantee of workmanship, availability, pricing, licensing, insurance, or results. Shop discovery features may require verification before a business is publicly listed.</p>

        <h2>4. Parts and modifications</h2>
        <p>Some automotive modifications may be restricted for street use or may affect emissions compliance, vehicle warranties, insurance coverage, safety systems, or local laws. Products marked for off-road or competition use should not be treated as legal for public-road use unless applicable law and product documentation allow it.</p>

        <h2>5. Accounts</h2>
        <p>Users are responsible for accurate account and vehicle information, safeguarding login credentials, and activity performed through their account. Do not use ModMatch Auto to submit false shop, product, review, pricing, inventory, or licensing information.</p>

        <h2>6. Third-party links and commerce</h2>
        <p>ModMatch Auto may link to manufacturers, distributors, retailers, shops, videos, installation documents, or other third parties. A third-party site may have its own pricing, returns, warranty, privacy, and terms. If ModMatch Auto earns a commission from a link or transaction, the relationship should be disclosed near the relevant offer.</p>

        <h2>7. User content</h2>
        <p>Users should upload only content they have the right to use. Do not upload copyrighted product photography, manuals, videos, trademarks, or other material in a way that violates another party’s rights.</p>

        <h2>8. Safety</h2>
        <p>Automotive work can involve significant safety risks. ModMatch Auto does not replace service information, manufacturer procedures, required tools, qualified inspection, or professional installation. Safety-critical work should be performed using appropriate procedures and expertise.</p>

        <h2>9. Changes</h2>
        <p>These beta terms may be updated as commerce, shop booking, supplier integrations, and mobile applications are added. Commercial launch terms will be reviewed before paid marketplace transactions are enabled.</p>
      </div>
    </main>
  );
}
