"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calculator,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export default function ShopsPage() {
  const [laborRate, setLaborRate] = useState(165);
  const [laborHours, setLaborHours] = useState(3.2);
  const [parts, setParts] = useState(280);
  const [suppliesPct, setSuppliesPct] = useState(3);

  const estimate = useMemo(() => {
    const labor = Math.max(0, laborRate) * Math.max(0, laborHours);
    const supplies = labor * (Math.max(0, suppliesPct) / 100);
    return {
      labor,
      supplies,
      total: labor + Math.max(0, parts) + supplies,
    };
  }, [laborRate, laborHours, parts, suppliesPct]);

  return (
    <main className="shop-demo-shell">
      <header className="shop-demo-nav">
        <Link href="/" className="shop-back-link">
          <ArrowLeft size={17} /> ModMatch Auto
        </Link>
        <span className="shop-beta-pill">SHOP PARTNER PREVIEW</span>
      </header>

      <section className="shop-demo-hero">
        <div>
          <span className="micro-label">FOR MECHANICS & REPAIR SHOPS</span>
          <h1>Turn builds into booked work.</h1>
          <p>
            A shop gets its own profile, labor rate, service area, services, and estimate settings.
            Drivers can discover nearby shops without giving ModMatch Auto their home address.
          </p>
        </div>
        <div className="shop-preview-card">
          <div className="shop-preview-top">
            <div className="shop-preview-icon"><Building2 size={24} /></div>
            <div>
              <span className="micro-label">CUSTOMER VIEW</span>
              <h2>Example Auto Shop</h2>
              <p><MapPin size={14} /> Anaheim, CA · 4.8 miles away</p>
            </div>
          </div>
          <div className="shop-preview-stats">
            <div><span>LABOR RATE</span><strong>{money.format(laborRate)}/hr</strong></div>
            <div><span>SHOP TYPE</span><strong>Repair shop</strong></div>
            <div><span>SERVICE AREA</span><strong>25 miles</strong></div>
          </div>
          <div className="shop-preview-services">
            <span>Diagnostics</span><span>Maintenance</span><span>Brakes</span><span>Suspension</span>
          </div>
        </div>
      </section>

      <section className="shop-demo-section">
        <div className="shop-section-heading">
          <span className="micro-label">SHOP SIGNUP</span>
          <h2>What the shop owner enters</h2>
          <p>The account stays simple, but the business profile gives customers enough information to decide whether to contact the shop.</p>
        </div>
        <div className="shop-onboarding-grid">
          <article><span>01</span><Building2 /><h3>Account & business</h3><p>Name, email, password, business name, contact name, phone, and optional website.</p></article>
          <article><span>02</span><MapPin /><h3>Location or service area</h3><p>Physical shops add the business address. Mobile mechanics can use a ZIP/city plus a service radius.</p></article>
          <article><span>03</span><Calculator /><h3>Pricing</h3><p>Hourly labor rate, diagnostic fee, optional shop-supplies percentage, and service-specific pricing.</p></article>
          <article><span>04</span><Wrench /><h3>Services</h3><p>Select services offered and optionally save labor hours or a flat price for common jobs.</p></article>
        </div>
      </section>

      <section className="shop-demo-split">
        <div className="shop-demo-panel">
          <span className="micro-label">CUSTOMER PRIVACY</span>
          <h2>Customers do not need to enter a home address.</h2>
          <div className="shop-check-list">
            <p><CheckCircle2 /> Search by ZIP or city.</p>
            <p><CheckCircle2 /> Or allow location only while looking for nearby shops.</p>
            <p><CheckCircle2 /> Exact address is only needed later if a mobile service or appointment requires it.</p>
          </div>
          <div className="shop-note"><ShieldCheck size={18} /> The shop’s public business location can be used to calculate distance. Mobile mechanics can publish a service area instead of a street address.</div>
        </div>

        <div className="shop-demo-panel">
          <span className="micro-label">HOW DISTANCE WORKS</span>
          <h2>“4.8 miles away” comes from location coordinates.</h2>
          <p className="shop-panel-copy">We store a shop location (or service-area center). When a customer searches, ModMatch Auto compares that point with the customer’s ZIP/city or optional current location and sorts nearby shops by distance.</p>
          <div className="shop-distance-visual">
            <div><Building2 /><span>SHOP</span></div>
            <span className="shop-distance-line">4.8 mi</span>
            <div><Smartphone /><span>DRIVER</span></div>
          </div>
        </div>
      </section>

      <section className="shop-demo-section">
        <div className="shop-section-heading">
          <span className="micro-label">LABOR ESTIMATE DEMO</span>
          <h2>How the estimate number is calculated</h2>
          <p>The shop controls its hourly rate. Labor hours come from a labor guide, the shop’s own saved time, or a custom quote.</p>
        </div>

        <div className="shop-estimator">
          <div className="shop-estimator-form">
            <label><span>SHOP LABOR RATE</span><div className="shop-money-input"><span>$</span><input type="number" min="0" step="1" value={laborRate} onChange={(e) => setLaborRate(Number(e.target.value))} /><small>/ hr</small></div></label>
            <label><span>LABOR HOURS</span><div className="shop-money-input"><Clock3 size={16} /><input type="number" min="0" step="0.1" value={laborHours} onChange={(e) => setLaborHours(Number(e.target.value))} /><small>hrs</small></div></label>
            <label><span>PARTS ESTIMATE</span><div className="shop-money-input"><span>$</span><input type="number" min="0" step="1" value={parts} onChange={(e) => setParts(Number(e.target.value))} /></div></label>
            <label><span>SHOP SUPPLIES EXAMPLE</span><div className="shop-money-input"><input type="number" min="0" step="0.5" value={suppliesPct} onChange={(e) => setSuppliesPct(Number(e.target.value))} /><small>% of labor</small></div></label>
          </div>

          <div className="shop-estimate-result">
            <span className="micro-label">ESTIMATE PREVIEW</span>
            <div><span>Labor ({laborHours} hrs × {money.format(laborRate)})</span><strong>{money.format(estimate.labor)}</strong></div>
            <div><span>Parts</span><strong>{money.format(parts)}</strong></div>
            <div><span>Shop supplies example</span><strong>{money.format(estimate.supplies)}</strong></div>
            <div className="shop-estimate-total"><span>ESTIMATED TOTAL BEFORE TAX/OTHER FEES</span><strong>{money.format(estimate.total)}</strong></div>
            <p>Example only. The shop can change labor hours, parts, fees, and final pricing before sending a quote.</p>
          </div>
        </div>
      </section>

      <section className="shop-demo-split">
        <div className="shop-demo-panel">
          <span className="micro-label">WHERE LABOR HOURS COME FROM</span>
          <h2>Three levels of accuracy</h2>
          <div className="labor-source-list">
            <div><b>1</b><span><strong>Shop-entered time</strong><small>Available now. A shop saves its normal billed hours for common services.</small></span></div>
            <div><b>2</b><span><strong>Licensed labor guide</strong><small>Future integration with a professional provider can auto-fill standard hours for the exact vehicle/job.</small></span></div>
            <div><b>3</b><span><strong>Custom quote</strong><small>The shop can override the guide when rust, modifications, diagnostics, or vehicle condition change the job.</small></span></div>
          </div>
        </div>

        <div className="shop-demo-panel">
          <span className="micro-label">WHY A SHOP WOULD JOIN</span>
          <h2>A build can become a lead.</h2>
          <div className="shop-check-list">
            <p><CheckCircle2 /> Customer already has vehicle and planned mods saved.</p>
            <p><CheckCircle2 /> Shop sees what the customer wants before quoting.</p>
            <p><CheckCircle2 /> Shop’s labor rate automatically feeds the estimate.</p>
            <p><CheckCircle2 /> Customer can compare distance, services, and eventually availability/reviews.</p>
          </div>
        </div>
      </section>

      <section className="shop-roadmap">
        <span className="micro-label">NEXT SHOP FEATURES</span>
        <h2>What we would build after the beta proves demand</h2>
        <div className="shop-roadmap-grid">
          <span>Quote requests</span><span>Appointment requests</span><span>Shop photos & logo</span><span>Reviews</span><span>Certifications</span><span>Technician specialties</span><span>VIN-based labor lookup</span><span>Parts sourcing</span>
        </div>
      </section>

      <footer className="shop-demo-footer">
        <div><strong>ModMatch Auto</strong><span>SEE IT. PRICE IT. BUILD IT.</span></div>
        <Link href="/" className="button button-primary">Back to ModMatch Auto</Link>
      </footer>
    </main>
  );
}
