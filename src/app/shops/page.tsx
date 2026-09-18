"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calculator,
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type ShopProfile = {
  id: string;
  owner_id: string;
  business_name: string;
  contact_name: string;
  shop_type: "repair_shop" | "mobile_mechanic" | "both";
  phone: string;
  email: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  service_radius_miles: number;
  labor_rate: number;
  diagnostic_fee: number;
  shop_supplies_percent: number;
  bio: string;
  website: string;
  is_published: boolean;
  verification_status: "pending" | "verified" | "rejected" | "suspended";
  bar_license_number: string;
  license_jurisdiction: string;
};

type ShopService = {
  id: string;
  name: string;
  category: string;
  labor_hours: number | null;
  parts_estimate: number;
  flat_price: number | null;
};

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

  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [services, setServices] = useState<ShopService[]>([]);
  const [serviceBusy, setServiceBusy] = useState(false);

  const estimate = useMemo(() => {
    const labor = Math.max(0, laborRate) * Math.max(0, laborHours);
    const supplies = labor * (Math.max(0, suppliesPct) / 100);
    return {
      labor,
      supplies,
      total: labor + Math.max(0, parts) + supplies,
    };
  }, [laborRate, laborHours, parts, suppliesPct]);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const user = data.session?.user;
      if (user) {
        setAuthUser({ id: user.id, email: user.email ?? "" });
        if (
          user.user_metadata?.beta_terms_version === "2026-09-18-beta" &&
          user.user_metadata?.beta_privacy_version === "2026-09-18-beta" &&
          user.user_metadata?.marketplace_terms_version === "2026-09-18-beta"
        ) {
          void recordShopLegalAcceptances(user.id);
        }
        await loadShopProfile(user.id);
      }
    };

    void loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAuthUser(user ? { id: user.id, email: user.email ?? "" } : null);
      if (user) {
        if (
          user.user_metadata?.beta_terms_version === "2026-09-18-beta" &&
          user.user_metadata?.beta_privacy_version === "2026-09-18-beta" &&
          user.user_metadata?.marketplace_terms_version === "2026-09-18-beta"
        ) {
          void recordShopLegalAcceptances(user.id);
        }
        void loadShopProfile(user.id);
      } else {
        setProfile(null);
        setServices([]);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadShopProfile(userId: string) {
    const { data, error } = await supabase
      .from("shop_profiles")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (error) {
      setProfileMessage(error.message);
      return;
    }

    const nextProfile = data
      ? ({
          ...data,
          service_radius_miles: Number(data.service_radius_miles),
          labor_rate: Number(data.labor_rate),
          diagnostic_fee: Number(data.diagnostic_fee),
          shop_supplies_percent: Number(data.shop_supplies_percent),
        } as ShopProfile)
      : null;

    setProfile(nextProfile);
    if (nextProfile) {
      setLaborRate(nextProfile.labor_rate || 165);
      setSuppliesPct(nextProfile.shop_supplies_percent || 0);
      const { data: serviceRows } = await supabase
        .from("shop_services")
        .select("id,name,category,labor_hours,parts_estimate,flat_price")
        .eq("shop_id", nextProfile.id)
        .order("created_at", { ascending: true });
      setServices(
        (serviceRows ?? []).map((row) => ({
          ...row,
          labor_hours: row.labor_hours == null ? null : Number(row.labor_hours),
          parts_estimate: Number(row.parts_estimate),
          flat_price: row.flat_price == null ? null : Number(row.flat_price),
        })) as ShopService[],
      );
    }
  }

  async function recordShopLegalAcceptances(userId: string) {
    const { error } = await supabase.from("legal_acceptances").upsert(
      [
        { user_id: userId, document_type: "terms", document_version: "2026-09-18-beta" },
        { user_id: userId, document_type: "privacy", document_version: "2026-09-18-beta" },
        { user_id: userId, document_type: "marketplace_terms", document_version: "2026-09-18-beta" },
      ],
      {
        onConflict: "user_id,document_type,document_version",
        ignoreDuplicates: true,
      },
    );
    if (error) console.warn("Could not record shop legal acceptance", error.message);
  }

  async function submitShopAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();
    const termsAccepted = form.get("termsAccepted") === "on";
    const privacyAccepted = form.get("privacyAccepted") === "on";
    const marketplaceAccepted = form.get("marketplaceAccepted") === "on";

    if (authMode === "signup" && (!termsAccepted || !privacyAccepted || !marketplaceAccepted)) {
      setAuthMessage("Please review and accept the beta legal notices.");
      setAuthBusy(false);
      return;
    }

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            account_type: "shop",
            beta_terms_version: "2026-09-18-beta",
            beta_privacy_version: "2026-09-18-beta",
            marketplace_terms_version: "2026-09-18-beta",
          },
          emailRedirectTo: "https://modmatchauto.com/shops/",
        },
      });
      if (error) setAuthMessage(error.message);
      else if (!data.session) {
        setAuthMessage("Check your email to confirm the shop account, then return here and sign in.");
      } else {
        if (data.user) void recordShopLegalAcceptances(data.user.id);
        setAuthMessage("Shop account created. Complete your business profile below.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setAuthMessage(error ? error.message : "Signed in. Complete or update your shop profile below.");
    }

    setAuthBusy(false);
  }

  async function saveShopProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authUser) return;
    setProfileBusy(true);
    setProfileMessage("");

    const form = new FormData(event.currentTarget);
    const state = String(form.get("state") ?? "").trim().toUpperCase();
    const barLicenseNumber = String(form.get("barLicenseNumber") ?? "").trim();
    const wantsPublication = form.get("isPublished") === "on";

    if (wantsPublication && state === "CA" && !barLicenseNumber) {
      setProfileMessage("California repair businesses need a BAR/repair-business license number before requesting public discovery.");
      setProfileBusy(false);
      return;
    }

    const payload = {
      owner_id: authUser.id,
      business_name: String(form.get("businessName") ?? "").trim(),
      contact_name: String(form.get("contactName") ?? "").trim(),
      shop_type: String(form.get("shopType") ?? "repair_shop"),
      phone: String(form.get("phone") ?? "").trim(),
      email: String(form.get("businessEmail") ?? authUser.email).trim(),
      address_line1: String(form.get("address") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      state,
      postal_code: String(form.get("postalCode") ?? "").trim(),
      service_radius_miles: Number(form.get("serviceRadius") || 25),
      labor_rate: Number(form.get("laborRate") || 0),
      diagnostic_fee: Number(form.get("diagnosticFee") || 0),
      shop_supplies_percent: Number(form.get("suppliesPercent") || 0),
      bio: String(form.get("bio") ?? "").trim(),
      website: String(form.get("website") ?? "").trim(),
      is_published: wantsPublication,
      bar_license_number: barLicenseNumber,
      license_jurisdiction: String(form.get("licenseJurisdiction") ?? state || "CA").trim(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("shop_profiles")
      .upsert(payload, { onConflict: "owner_id" })
      .select()
      .single();

    if (error) {
      setProfileMessage(error.message);
    } else {
      const saved = {
        ...data,
        service_radius_miles: Number(data.service_radius_miles),
        labor_rate: Number(data.labor_rate),
        diagnostic_fee: Number(data.diagnostic_fee),
        shop_supplies_percent: Number(data.shop_supplies_percent),
      } as ShopProfile;
      setProfile(saved);
      setLaborRate(saved.labor_rate || laborRate);
      setSuppliesPct(saved.shop_supplies_percent || 0);
      setProfileMessage(saved.is_published ? "Shop profile saved and published." : "Shop profile saved as a draft.");
    }

    setProfileBusy(false);
  }

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setServiceBusy(true);

    const form = new FormData(event.currentTarget);
    const flatValue = String(form.get("flatPrice") ?? "").trim();

    const { data, error } = await supabase
      .from("shop_services")
      .insert({
        shop_id: profile.id,
        name: String(form.get("serviceName") ?? "").trim(),
        category: String(form.get("category") ?? "General Repair").trim(),
        labor_hours: Number(form.get("laborHours") || 0),
        labor_time_source: "shop_entered",
        parts_estimate: Number(form.get("partsEstimate") || 0),
        flat_price: flatValue ? Number(flatValue) : null,
        notes: String(form.get("notes") ?? "").trim(),
      })
      .select("id,name,category,labor_hours,parts_estimate,flat_price")
      .single();

    if (!error && data) {
      setServices((current) => [
        ...current,
        {
          ...data,
          labor_hours: data.labor_hours == null ? null : Number(data.labor_hours),
          parts_estimate: Number(data.parts_estimate),
          flat_price: data.flat_price == null ? null : Number(data.flat_price),
        } as ShopService,
      ]);
      event.currentTarget.reset();
    } else if (error) {
      setProfileMessage(error.message);
    }

    setServiceBusy(false);
  }

  async function signOutShop() {
    await supabase.auth.signOut();
    setAuthMessage("");
    setProfileMessage("");
  }

  return (
    <main className="shop-demo-shell">
      <header className="shop-demo-nav">
        <Link href="/" className="shop-back-link">
          <ArrowLeft size={17} /> ModMatch Auto
        </Link>
        <span className="shop-beta-pill">SHOP PARTNER BETA</span>
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
              <h2>{profile?.business_name || "Example Auto Shop"}</h2>
              <p><MapPin size={14} /> {profile?.city || "Anaheim"}, {profile?.state || "CA"} · nearby</p>
            </div>
          </div>
          <div className="shop-preview-stats">
            <div><span>LABOR RATE</span><strong>{money.format(profile?.labor_rate || laborRate)}/hr</strong></div>
            <div><span>SHOP TYPE</span><strong>{profile ? profile.shop_type.replaceAll("_", " ") : "Repair shop"}</strong></div>
            <div><span>SERVICE AREA</span><strong>{profile?.service_radius_miles || 25} miles</strong></div>
          </div>
          <div className="shop-preview-services">
            {(services.length ? services.slice(0, 4).map((service) => service.name) : ["Diagnostics","Maintenance","Brakes","Suspension"]).map((service) => <span key={service}>{service}</span>)}
          </div>
        </div>
      </section>

      <section className="shop-account-section">
        <div className="shop-section-heading">
          <span className="micro-label">TRY THE SHOP SIDE</span>
          <h2>{authUser ? "Manage your shop profile" : "Create a shop account"}</h2>
          <p>This is the real beta onboarding flow that a mechanic or shop owner can use.</p>
        </div>

        {!authUser ? (
          <div className="shop-account-card">
            <div className="shop-auth-toggle">
              <button className={authMode === "signup" ? "active" : ""} onClick={() => { setAuthMode("signup"); setAuthMessage(""); }}>Create shop account</button>
              <button className={authMode === "signin" ? "active" : ""} onClick={() => { setAuthMode("signin"); setAuthMessage(""); }}>Shop sign in</button>
            </div>
            <form className="shop-profile-form" onSubmit={submitShopAuth}>
              {authMode === "signup" && <label><span>YOUR NAME</span><input name="fullName" required placeholder="Owner or manager name" /></label>}
              <label><span>EMAIL</span><input name="email" type="email" required autoComplete="email" placeholder="shop@example.com" /></label>
              <label><span>PASSWORD</span><input name="password" type="password" minLength={8} required autoComplete={authMode === "signup" ? "new-password" : "current-password"} placeholder="8+ characters" /></label>
              {authMode === "signup" && (
                <div className="legal-consent-group shop-legal-consent">
                  <label className="legal-consent"><input name="termsAccepted" type="checkbox" required /><span>I agree to the <Link href="/legal/terms/" target="_blank">Beta Terms</Link>.</span></label>
                  <label className="legal-consent"><input name="privacyAccepted" type="checkbox" required /><span>I have read the <Link href="/legal/privacy/" target="_blank">Privacy Notice</Link>.</span></label>
                  <label className="legal-consent"><input name="marketplaceAccepted" type="checkbox" required /><span>I understand the <Link href="/legal/marketplace/" target="_blank">Parts & marketplace safety policy</Link>.</span></label>
                </div>
              )}
              <button className="button button-primary" disabled={authBusy}>{authBusy ? "Working…" : authMode === "signup" ? "Create shop account" : "Sign in"}</button>
            </form>
            {authMessage && <p className="shop-form-message">{authMessage}</p>}
          </div>
        ) : (
          <>
            <div className="shop-account-toolbar">
              <div><strong>{authUser.email}</strong><span>{profile ? `Verification: ${profile.verification_status}` : "Shop profile draft"}</span></div>
              <button className="button button-secondary button-small" onClick={signOutShop}><LogOut size={15} /> Sign out</button>
            </div>

            <form key={profile?.id || "new"} className="shop-profile-card" onSubmit={saveShopProfile}>
              <div className="shop-profile-grid">
                <label><span>BUSINESS NAME</span><input name="businessName" required defaultValue={profile?.business_name || ""} placeholder="Example Auto Shop" /></label>
                <label><span>CONTACT NAME</span><input name="contactName" required defaultValue={profile?.contact_name || ""} placeholder="Owner / manager" /></label>
                <label><span>SHOP TYPE</span><select name="shopType" defaultValue={profile?.shop_type || "repair_shop"}><option value="repair_shop">Repair shop</option><option value="mobile_mechanic">Mobile mechanic</option><option value="both">Shop + mobile service</option></select></label>
                <label><span>PUBLIC PHONE</span><input name="phone" defaultValue={profile?.phone || ""} placeholder="(714) 555-0123" /></label>
                <label><span>BUSINESS EMAIL</span><input name="businessEmail" type="email" defaultValue={profile?.email || authUser.email} /></label>
                <label><span>WEBSITE (OPTIONAL)</span><input name="website" type="url" defaultValue={profile?.website || ""} placeholder="https://" /></label>
                <label className="shop-span-two"><span>BUSINESS ADDRESS (PHYSICAL SHOPS)</span><input name="address" defaultValue={profile?.address_line1 || ""} placeholder="123 Main St" /></label>
                <label><span>CITY</span><input name="city" required defaultValue={profile?.city || ""} placeholder="Anaheim" /></label>
                <label><span>STATE</span><input name="state" required defaultValue={profile?.state || "CA"} placeholder="CA" /></label>
                <label><span>ZIP / POSTAL CODE</span><input name="postalCode" required defaultValue={profile?.postal_code || ""} placeholder="92805" /></label>
                <label><span>REPAIR BUSINESS / BAR LICENSE #</span><input name="barLicenseNumber" defaultValue={profile?.bar_license_number || ""} placeholder="Required before CA public listing" /></label>
                <label><span>LICENSE JURISDICTION</span><input name="licenseJurisdiction" defaultValue={profile?.license_jurisdiction || "CA"} placeholder="CA" /></label>
                <label><span>SERVICE RADIUS (MILES)</span><input name="serviceRadius" type="number" min="0" max="500" defaultValue={profile?.service_radius_miles || 25} /></label>
                <label><span>HOURLY LABOR RATE</span><input name="laborRate" type="number" min="0" step="1" required defaultValue={profile?.labor_rate || 165} /></label>
                <label><span>DIAGNOSTIC FEE</span><input name="diagnosticFee" type="number" min="0" step="1" defaultValue={profile?.diagnostic_fee || 0} /></label>
                <label><span>SHOP SUPPLIES %</span><input name="suppliesPercent" type="number" min="0" max="100" step=".5" defaultValue={profile?.shop_supplies_percent || 0} /></label>
                <label className="shop-span-two"><span>SHOP BIO</span><textarea name="bio" rows={4} defaultValue={profile?.bio || ""} placeholder="Tell customers what you specialize in, certifications, experience, warranty policy, etc." /></label>
              </div>
              <label className="shop-publish-toggle"><input name="isPublished" type="checkbox" defaultChecked={profile?.is_published || false} /><span><strong>Request public discovery</strong><small>Saving this preference does not publish the shop automatically. ModMatch verification must be completed first.</small></span></label>
              <button className="button button-primary" disabled={profileBusy}>{profileBusy ? "Saving…" : "Save shop profile"}</button>
              {profileMessage && <p className="shop-form-message">{profileMessage}</p>}
            </form>

            {profile && (
              <div className="shop-service-builder">
                <div className="shop-section-heading">
                  <span className="micro-label">COMMON SERVICES</span>
                  <h2>Save the shop’s normal labor time</h2>
                  <p>This is the beta method until ModMatch Auto licenses a professional labor-time guide.</p>
                </div>
                <form className="shop-profile-card" onSubmit={addService}>
                  <div className="shop-profile-grid">
                    <label><span>SERVICE / JOB</span><input name="serviceName" required placeholder="Front brake pads & rotors" /></label>
                    <label><span>CATEGORY</span><input name="category" defaultValue="General Repair" /></label>
                    <label><span>LABOR HOURS</span><input name="laborHours" type="number" min="0" step=".1" required placeholder="2.0" /></label>
                    <label><span>PARTS ESTIMATE</span><input name="partsEstimate" type="number" min="0" step="1" defaultValue="0" /></label>
                    <label><span>FLAT PRICE (OPTIONAL)</span><input name="flatPrice" type="number" min="0" step="1" placeholder="Leave blank" /></label>
                    <label><span>NOTES</span><input name="notes" placeholder="Includes standard hardware…" /></label>
                  </div>
                  <button className="button button-secondary" disabled={serviceBusy}>{serviceBusy ? "Adding…" : "Add service"}</button>
                </form>
                {services.length > 0 && <div className="shop-service-list">{services.map((service) => <div key={service.id}><div><strong>{service.name}</strong><span>{service.category}</span></div><span>{service.labor_hours ?? 0} hrs</span><span>{service.flat_price != null ? money.format(service.flat_price) : "Rate × hours"}</span></div>)}</div>}
              </div>
            )}
          </>
        )}
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
