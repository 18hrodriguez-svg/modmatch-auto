import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <div className="legal-card">
        <Link href="/" className="legal-back">← Back to ModMatch Auto</Link>
        <span className="micro-label">BETA PRIVACY NOTICE</span>
        <h1>Privacy Notice</h1>
        <p className="legal-updated">Effective September 18, 2026</p>

        <h2>Information we currently use</h2>
        <p>ModMatch Auto may process account information such as email address, saved vehicles, build plans, budgets, parts, feedback, and shop profile information. Shop profiles may include business contact details, service area, labor rate, services, and licensing information.</p>

        <h2>Location</h2>
        <p>A consumer does not need to provide a home street address simply to create a garage. Future nearby-shop search may use a city or ZIP code, or optional device location when the user chooses to share it. Exact service addresses should only be requested when necessary for shipping, appointments, or mobile service.</p>

        <h2>Why we use information</h2>
        <p>We use information to operate accounts, save garages and builds, improve fitment and pricing workflows, support shop discovery, respond to feedback, prevent abuse, and develop future ordering and appointment features.</p>

        <h2>Third parties</h2>
        <p>The beta currently uses service providers including Supabase for account/database infrastructure and Netlify for website hosting. Future payment, analytics, supplier, mapping, shipping, or marketplace services will be documented as they are added.</p>

        <h2>Data minimization</h2>
        <p>ModMatch Auto is being designed to avoid collecting sensitive information unless it is needed for a specific feature. Wholesale cost data, marketplace verification records, payment details, and similar information should not be exposed through the public client application.</p>

        <h2>Security</h2>
        <p>Access controls are used so customer garage/build records are limited to the relevant account. Shop and commerce data use separate access rules. No online service can guarantee absolute security, so the platform will continue to add safeguards as features expand.</p>

        <h2>Choices and requests</h2>
        <p>Users can sign out at any time and may request help with account information through ModMatch Auto’s feedback/support workflow during beta. Before commercial launch, dedicated privacy-contact and deletion/correction workflows will be published.</p>

        <h2>Children</h2>
        <p>ModMatch Auto is a general-audience automotive service and is not designed for children under 13. We are not intentionally building features that require collecting personal information from children under 13.</p>

        <h2>Updates</h2>
        <p>This notice will be updated before introducing paid commerce, payment processing, precise-location services, advertising, or international operations.</p>
      </div>
    </main>
  );
}
