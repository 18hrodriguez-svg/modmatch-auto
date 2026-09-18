"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  Check,
  ChevronDown,
  CircleDollarSign,
  Gauge,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import {
  Build,
  BuildItem,
  CatalogPart,
  MOD_CATEGORIES,
  ModCategory,
  Vehicle,
} from "@/lib/types";

type AppView = "garage" | "mods" | "build";
type AuthMode = "signin" | "signup";

const CATALOG: CatalogPart[] = [
  {
    id: "wheels-flow-formed",
    category: "Wheels & Tires",
    name: "Flow-Formed Wheel Package",
    brand: "Apex",
    vendor: "Direct vendor",
    price: 1695,
    installCost: 160,
    difficulty: "Moderate",
    note: "Select diameter, width, offset, bolt pattern, and tire size for your exact vehicle.",
  },
  {
    id: "coilover-street",
    category: "Suspension",
    name: "Street Performance Coilovers",
    brand: "BC Racing",
    vendor: "Authorized dealer",
    price: 1295,
    installCost: 650,
    difficulty: "Advanced",
    note: "Vehicle-specific kit. Alignment required after installation.",
  },
  {
    id: "intake-high-flow",
    category: "Intake",
    name: "High-Flow Intake System",
    brand: "K&N",
    vendor: "Parts retailer",
    price: 399,
    installCost: 110,
    difficulty: "Easy",
    note: "Confirm engine and emissions compatibility before ordering.",
  },
  {
    id: "exhaust-catback",
    category: "Exhaust",
    name: "Stainless Cat-Back Exhaust",
    brand: "Borla",
    vendor: "Authorized dealer",
    price: 1189,
    installCost: 280,
    difficulty: "Moderate",
    note: "Configuration varies by wheelbase, drivetrain, and exhaust layout.",
  },
  {
    id: "tune-stage-one",
    category: "Performance",
    name: "Stage 1 ECU Calibration",
    brand: "Platform matched",
    vendor: "Certified tuner",
    price: 699,
    installCost: 0,
    difficulty: "Advanced",
    note: "Requires compatibility review and healthy baseline diagnostics.",
  },
  {
    id: "lighting-led",
    category: "Lighting",
    name: "Premium LED Lighting Kit",
    brand: "Morimoto",
    vendor: "Lighting retailer",
    price: 289,
    installCost: 140,
    difficulty: "Easy",
    note: "Housing and connector type must match the selected vehicle.",
  },
  {
    id: "exterior-splitter",
    category: "Exterior",
    name: "Vehicle-Specific Front Splitter",
    brand: "Street Aero",
    vendor: "Direct vendor",
    price: 349,
    installCost: 220,
    difficulty: "Moderate",
    note: "Verify bumper style and trim package before ordering.",
  },
  {
    id: "interior-dashcam",
    category: "Interior",
    name: "4K Dual-Channel Dash Camera",
    brand: "Viofo",
    vendor: "Electronics retailer",
    price: 329,
    installCost: 180,
    difficulty: "Easy",
    note: "Universal fit. Hardwire kit may be required for parking mode.",
  },
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup" aria-label="ModMatch Auto">
      <span className="brand-mark">
        <CarFront size={compact ? 20 : 23} strokeWidth={2.2} />
      </span>
      <span className="brand-name">
        MODMATCH <b>AUTO</b>
      </span>
    </div>
  );
}

export function ModMatchApp() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [view, setView] = useState<AppView>("garage");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [items, setItems] = useState<BuildItem[]>([]);
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [category, setCategory] = useState<ModCategory | "All">("All");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationBusy, setConfirmationBusy] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const loadWorkspace = useCallback(async () => {
    setWorkspaceBusy(true);
    const [vehiclesResult, buildsResult, itemsResult] = await Promise.all([
      supabase.from("vehicles").select("*").order("created_at", { ascending: true }),
      supabase.from("builds").select("*").order("created_at", { ascending: true }),
      supabase.from("build_items").select("*").order("created_at", { ascending: true }),
    ]);

    const firstError = vehiclesResult.error || buildsResult.error || itemsResult.error;
    if (firstError) {
      setNotice(`Could not load your garage: ${firstError.message}`);
      setWorkspaceBusy(false);
      return;
    }

    const loadedVehicles = (vehiclesResult.data ?? []) as Vehicle[];
    const loadedBuilds = ((buildsResult.data ?? []) as Build[]).map((build) => ({
      ...build,
      budget: Number(build.budget),
    }));
    const loadedItems = ((itemsResult.data ?? []) as BuildItem[]).map((item) => ({
      ...item,
      price: Number(item.price),
      install_cost: Number(item.install_cost),
    }));

    setVehicles(loadedVehicles);
    setBuilds(loadedBuilds);
    setItems(loadedItems);
    setSelectedVehicleId((current) =>
      current && loadedVehicles.some((vehicle) => vehicle.id === current)
        ? current
        : loadedVehicles[0]?.id ?? "",
    );
    setWorkspaceBusy(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    const returnedFromSignup =
      window.location.hash.includes("type=signup") ||
      new URLSearchParams(window.location.search).get("type") === "signup";
    const returnedFromRecovery =
      window.location.hash.includes("type=recovery") ||
      new URLSearchParams(window.location.search).get("reset") === "1";

    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? "" });
        if (
          data.user.user_metadata?.beta_terms_version === "2026-09-18-beta" &&
          data.user.user_metadata?.beta_privacy_version === "2026-09-18-beta"
        ) {
          void recordBetaLegalAcceptances(data.user.id);
        }
        void loadWorkspace();
        if (returnedFromSignup) {
          setNotice("Email confirmed — welcome to ModMatch Auto.");
          window.history.replaceState({}, "", window.location.pathname);
        }
        if (returnedFromRecovery) {
          setResetOpen(true);
        }
      }
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user;
      setUser(nextUser ? { id: nextUser.id, email: nextUser.email ?? "" } : null);
      if (event === "PASSWORD_RECOVERY") {
        setResetMessage("");
        setResetOpen(true);
      }
      if (nextUser) {
        if (
          nextUser.user_metadata?.beta_terms_version === "2026-09-18-beta" &&
          nextUser.user_metadata?.beta_privacy_version === "2026-09-18-beta"
        ) {
          void recordBetaLegalAcceptances(nextUser.id);
        }
        void loadWorkspace();
      }
      else {
        setVehicles([]);
        setBuilds([]);
        setItems([]);
        setSelectedVehicleId("");
      }
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadWorkspace]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
  const activeBuild = builds.find((build) => build.vehicle_id === selectedVehicleId);
  const activeItems = items.filter((item) => item.build_id === activeBuild?.id);
  const partsTotal = activeItems.reduce((sum, item) => sum + item.price, 0);
  const laborTotal = activeItems.reduce((sum, item) => sum + item.install_cost, 0);
  const buildTotal = partsTotal + laborTotal;
  const budgetRemaining = (activeBuild?.budget ?? 0) - buildTotal;

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    return CATALOG.filter((part) => {
      const categoryMatches = category === "All" || part.category === category;
      const textMatches =
        !query ||
        `${part.name} ${part.brand} ${part.category}`.toLowerCase().includes(query);
      return categoryMatches && textMatches;
    });
  }, [category, search]);

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setAuthMessage("");
    setAuthOpen(true);
  }

  async function recordBetaLegalAcceptances(userId: string) {
    const { error } = await supabase.from("legal_acceptances").upsert(
      [
        { user_id: userId, document_type: "terms", document_version: "2026-09-18-beta" },
        { user_id: userId, document_type: "privacy", document_version: "2026-09-18-beta" },
      ],
      {
        onConflict: "user_id,document_type,document_version",
        ignoreDuplicates: true,
      },
    );
    if (error) console.warn("Could not record legal acceptance", error.message);
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();
    const termsAccepted = form.get("termsAccepted") === "on";
    const privacyAccepted = form.get("privacyAccepted") === "on";

    if (authMode === "signup" && (!termsAccepted || !privacyAccepted)) {
      setAuthMessage("Please review and accept the Beta Terms and Privacy Notice.");
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
            beta_terms_version: "2026-09-18-beta",
            beta_privacy_version: "2026-09-18-beta",
          },
          emailRedirectTo: "https://modmatchauto.com",
        },
      });
      if (error) setAuthMessage(error.message);
      else if (!data.session) {
        setPendingEmail(email);
        setAuthOpen(false);
        setConfirmationMessage("");
        setConfirmationOpen(true);
      } else {
        if (data.user) void recordBetaLegalAcceptances(data.user.id);
        setAuthOpen(false);
        setNotice("Welcome to ModMatch Auto.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthMessage(error.message);
      else {
        setAuthOpen(false);
        setNotice("Welcome back.");
      }
    }
    setAuthBusy(false);
  }

  async function resendConfirmation() {
    if (!pendingEmail) return;
    setConfirmationBusy(true);
    setConfirmationMessage("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
      options: { emailRedirectTo: "https://modmatchauto.com" },
    });
    setConfirmationMessage(
      error
        ? error.message
        : "Confirmation email resent. Check your inbox and spam folder.",
    );
    setConfirmationBusy(false);
  }

  async function requestPasswordReset(email: string) {
    if (!email) {
      setAuthMessage("Enter your email address first, then tap Forgot password.");
      return;
    }
    setAuthBusy(true);
    setAuthMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://modmatchauto.com?reset=1",
    });
    setAuthMessage(
      error
        ? error.message
        : "Password reset email sent. Check your inbox and spam folder.",
    );
    setAuthBusy(false);
  }

  async function submitNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetBusy(true);
    setResetMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setResetMessage("Use at least 8 characters.");
      setResetBusy(false);
      return;
    }
    if (password !== confirmPassword) {
      setResetMessage("The passwords do not match.");
      setResetBusy(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setResetMessage(error.message);
    } else {
      setResetOpen(false);
      setResetMessage("");
      window.history.replaceState({}, "", window.location.pathname);
      setNotice("Password updated successfully.");
    }
    setResetBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setView("garage");
    setNotice("You are signed out.");
  }

  async function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    const vehicleInput = {
      user_id: user.id,
      year: Number(form.get("year")),
      make: String(form.get("make") ?? "").trim(),
      model: String(form.get("model") ?? "").trim(),
      trim: String(form.get("trim") ?? "").trim(),
      engine: String(form.get("engine") ?? "").trim(),
      nickname: String(form.get("nickname") ?? "").trim(),
    };

    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .insert(vehicleInput)
      .select()
      .single();
    if (error || !vehicle) {
      setNotice(error?.message ?? "Could not add the vehicle.");
      return;
    }

    const { error: buildError } = await supabase.from("builds").insert({
      user_id: user.id,
      vehicle_id: vehicle.id,
      name: `${vehicle.year} ${vehicle.make} ${vehicle.model} Build`,
      status: "planning",
    });
    if (buildError) {
      await supabase.from("vehicles").delete().eq("id", vehicle.id);
      setNotice(buildError.message);
      return;
    }

    setVehicleModalOpen(false);
    await loadWorkspace();
    setSelectedVehicleId(vehicle.id);
    setNotice("Vehicle added to your garage.");
  }

  async function addCatalogPart(part: CatalogPart) {
    if (!user || !activeBuild || !selectedVehicle) {
      setNotice("Add a vehicle before building your setup.");
      return;
    }
    const { error } = await supabase.from("build_items").insert({
      user_id: user.id,
      build_id: activeBuild.id,
      category: part.category,
      part_name: part.name,
      brand: part.brand,
      vendor: part.vendor,
      price: part.price,
      install_cost: part.installCost,
      fitment_notes: `Review fitment for ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}. ${part.note}`,
      status: "planned",
    });
    if (error) setNotice(error.message);
    else {
      await loadWorkspace();
      setNotice(`${part.name} added to your build.`);
    }
  }

  async function addCustomPart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !activeBuild) return;
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from("build_items").insert({
      user_id: user.id,
      build_id: activeBuild.id,
      category: String(form.get("category")),
      part_name: String(form.get("partName") ?? "").trim(),
      brand: String(form.get("brand") ?? "").trim(),
      vendor: String(form.get("vendor") ?? "").trim(),
      price: Number(form.get("price") || 0),
      install_cost: Number(form.get("installCost") || 0),
      product_url: String(form.get("productUrl") ?? "").trim(),
      fitment_notes: String(form.get("notes") ?? "").trim(),
      status: "planned",
    });
    if (error) setNotice(error.message);
    else {
      setPartModalOpen(false);
      await loadWorkspace();
      setNotice("Custom part added.");
    }
  }

  async function removeItem(itemId: string) {
    if (!user) return;
    const { error } = await supabase.from("build_items").delete().eq("id", itemId);
    if (error) setNotice(error.message);
    else {
      await loadWorkspace();
      setNotice("Part removed from your build.");
    }
  }

  async function updateBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !activeBuild) return;
    const form = new FormData(event.currentTarget);
    const budget = Number(form.get("budget") || 0);
    const { error } = await supabase
      .from("builds")
      .update({ budget })
      .eq("id", activeBuild.id);
    if (error) setNotice(error.message);
    else {
      await loadWorkspace();
      setNotice("Build budget updated.");
    }
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackBusy(true);
    setFeedbackMessage("");

    const form = new FormData(event.currentTarget);
    const wouldUse = String(form.get("wouldUse") ?? "");

    const { error } = await supabase.from("feedback").insert({
      user_id: user?.id ?? null,
      rating: Number(form.get("rating") || 5),
      role: String(form.get("role") ?? "").trim() || null,
      liked: String(form.get("liked") ?? "").trim() || null,
      confusing: String(form.get("confusing") ?? "").trim() || null,
      missing: String(form.get("missing") ?? "").trim() || null,
      would_use: wouldUse === "yes" ? true : wouldUse === "no" ? false : null,
      email: String(form.get("email") ?? "").trim() || null,
      page: user ? view : "landing",
    });

    if (error) {
      setFeedbackMessage("Could not send feedback yet. Please try again.");
    } else {
      setFeedbackMessage("Thank you — your feedback was saved.");
      event.currentTarget.reset();
      window.setTimeout(() => {
        setFeedbackOpen(false);
        setFeedbackMessage("");
      }, 1200);
    }
    setFeedbackBusy(false);
  }

  if (!authReady) {
    return (
      <main className="loading-screen">
        <Logo />
        <span className="loading-bar" />
      </main>
    );
  }

  if (resetOpen) {
    return (
      <main className="landing-shell auth-return-shell">
        <PasswordResetModal
          busy={resetBusy}
          message={resetMessage}
          onSubmit={submitNewPassword}
          onClose={() => setResetOpen(false)}
        />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="landing-shell">
        <header className="landing-nav">
          <Logo />
          <div className="landing-nav-actions">
            <Link className="button button-secondary shop-nav-link" href="/shops/">
              For shops
            </Link>
            <button className="button button-ghost" onClick={() => openAuth("signin")}>
              Sign in
            </button>
          </div>
        </header>

        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} /> Your build starts here
            </div>
            <h1>
              SEE IT.<br />
              <span>PRICE IT.</span><br />
              BUILD IT.
            </h1>
            <p>
              Put your vehicle, parts, installation costs, and complete build plan in one garage—before you spend a dollar.
            </p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => openAuth("signup")}>
                Start your build <ArrowRight size={18} />
              </button>
              <button className="button button-secondary" onClick={() => openAuth("signin")}>
                I have an account
              </button>
            </div>
            <div className="trust-row">
              <span><ShieldCheck size={16} /> Private garage</span>
              <span><CircleDollarSign size={16} /> Real cost planning</span>
              <span><BadgeCheck size={16} /> Fitment notes</span>
            </div>
          </div>

          <div className="hero-console" aria-label="Example ModMatch Auto build dashboard">
            <div className="console-topline">
              <span>ACTIVE BUILD</span>
              <span className="live-pill">PLANNING</span>
            </div>
            <div className="vehicle-visual">
              <div className="vehicle-orbit"><CarFront size={88} strokeWidth={1.15} /></div>
              <div>
                <span className="micro-label">YOUR GARAGE</span>
                <h2>2020 Mercedes-Benz E350</h2>
                <p>Base · RWD · 2.0L Turbo</p>
              </div>
            </div>
            <div className="console-stats">
              <div><span>PARTS</span><strong>$4,949</strong></div>
              <div><span>INSTALL</span><strong>$1,170</strong></div>
              <div className="total-stat"><span>BUILD TOTAL</span><strong>$6,119</strong></div>
            </div>
            <div className="blueprint-line"><span style={{ width: "68%" }} /></div>
            <div className="console-list">
              <span><Check size={15} /> Wheels & tires</span>
              <span><Check size={15} /> Suspension</span>
              <span><Check size={15} /> Exhaust</span>
            </div>
          </div>
        </section>

        <section className="landing-steps">
          <article><span>01</span><CarFront /><h3>Add your vehicle</h3><p>Save the exact year, make, model, trim, and engine.</p></article>
          <article><span>02</span><Search /><h3>Plan your mods</h3><p>Organize parts by category and keep fitment notes attached.</p></article>
          <article><span>03</span><Gauge /><h3>Know the total</h3><p>Track parts and labor against the budget you set.</p></article>
        </section>

        <footer className="landing-footer">
          <Logo compact />
          <p>Built for people who take their builds seriously.</p>
          <div className="landing-legal-links">
            <Link href="/legal/terms/">Terms</Link>
            <Link href="/legal/privacy/">Privacy</Link>
            <Link href="/legal/marketplace/">Parts & marketplace safety</Link>
          </div>
          <span>© 2026 ModMatch Auto</span>
        </footer>

        {authOpen && (
          <AuthModal
            mode={authMode}
            busy={authBusy}
            message={authMessage}
            onClose={() => setAuthOpen(false)}
            onModeChange={(mode) => { setAuthMode(mode); setAuthMessage(""); }}
            onForgotPassword={requestPasswordReset}
            onSubmit={submitAuth}
          />
        )}
        {confirmationOpen && (
          <ConfirmationModal
            email={pendingEmail}
            busy={confirmationBusy}
            message={confirmationMessage}
            onResend={resendConfirmation}
            onSignIn={() => {
              setConfirmationOpen(false);
              openAuth("signin");
            }}
            onClose={() => setConfirmationOpen(false)}
          />
        )}
        <button className="feedback-trigger" onClick={() => { setFeedbackMessage(""); setFeedbackOpen(true); }}>
          Give feedback
        </button>
        {feedbackOpen && (
          <FeedbackModal
            busy={feedbackBusy}
            message={feedbackMessage}
            onClose={() => setFeedbackOpen(false)}
            onSubmit={submitFeedback}
          />
        )}
        {notice && <div className="toast" role="status">{notice}</div>}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-head">
          <Logo compact />
          <button className="icon-button mobile-only" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={20} /></button>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavButton active={view === "garage"} icon={<CarFront />} label="My Garage" onClick={() => { setView("garage"); setMobileNavOpen(false); }} />
          <NavButton active={view === "mods"} icon={<Search />} label="Find Mods" onClick={() => { setView("mods"); setMobileNavOpen(false); }} />
          <NavButton active={view === "build"} icon={<Wrench />} label="My Build" onClick={() => { setView("build"); setMobileNavOpen(false); }} />
        </nav>
        <div className="sidebar-account">
          <div className="avatar"><UserRound size={18} /></div>
          <div><strong>My account</strong><span>{user.email}</span></div>
          <button className="icon-button" aria-label="Sign out" onClick={signOut}><LogOut size={18} /></button>
        </div>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <button className="icon-button mobile-only" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={22} /></button>
          <div className="mobile-brand mobile-only"><Logo compact /></div>
          <div className="vehicle-picker-wrap">
            {vehicles.length > 0 ? (
              <label className="vehicle-picker">
                <span className="sr-only">Selected vehicle</span>
                <CarFront size={17} />
                <select value={selectedVehicleId} onChange={(event) => setSelectedVehicleId(event.target.value)}>
                  {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>)}
                </select>
                <ChevronDown size={15} />
              </label>
            ) : <span className="header-status">GARAGE EMPTY</span>}
          </div>
          <button className="button button-primary button-small" onClick={() => setVehicleModalOpen(true)}><Plus size={17} /> Add vehicle</button>
        </header>

        <div className="workspace-content">
          {workspaceBusy ? (
            <div className="workspace-loading"><span className="loading-bar" /><p>Opening your garage…</p></div>
          ) : vehicles.length === 0 ? (
            <EmptyGarage onAdd={() => setVehicleModalOpen(true)} />
          ) : view === "garage" ? (
            <GarageView vehicle={selectedVehicle!} itemCount={activeItems.length} buildTotal={buildTotal} budget={activeBuild?.budget ?? 0} onFindMods={() => setView("mods")} onOpenBuild={() => setView("build")} />
          ) : view === "mods" ? (
            <ModsView vehicle={selectedVehicle!} parts={filteredCatalog} category={category} search={search} onCategory={setCategory} onSearch={setSearch} onAdd={addCatalogPart} />
          ) : (
            <BuildView vehicle={selectedVehicle!} build={activeBuild} items={activeItems} partsTotal={partsTotal} laborTotal={laborTotal} total={buildTotal} remaining={budgetRemaining} onAddCustom={() => setPartModalOpen(true)} onRemove={removeItem} onBudget={updateBudget} />
          )}
        </div>
      </section>

      <nav className="bottom-nav mobile-only" aria-label="Mobile navigation">
        <NavButton active={view === "garage"} icon={<CarFront />} label="Garage" onClick={() => setView("garage")} />
        <NavButton active={view === "mods"} icon={<Search />} label="Mods" onClick={() => setView("mods")} />
        <NavButton active={view === "build"} icon={<Wrench />} label="Build" onClick={() => setView("build")} />
      </nav>

      {vehicleModalOpen && <VehicleModal onClose={() => setVehicleModalOpen(false)} onSubmit={addVehicle} />}
      {partModalOpen && <CustomPartModal onClose={() => setPartModalOpen(false)} onSubmit={addCustomPart} />}
      <button className="feedback-trigger" onClick={() => { setFeedbackMessage(""); setFeedbackOpen(true); }}>
        Give feedback
      </button>
      {feedbackOpen && (
        <FeedbackModal
          busy={feedbackBusy}
          message={feedbackMessage}
          onClose={() => setFeedbackOpen(false)}
          onSubmit={submitFeedback}
        />
      )}
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function EmptyGarage({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="empty-garage">
      <div className="empty-icon"><CarFront size={52} /></div>
      <span className="micro-label">FIRST STEP</span>
      <h1>Bring your first car into the garage.</h1>
      <p>Add its exact details so every build plan starts with the right vehicle.</p>
      <button className="button button-primary" onClick={onAdd}><Plus size={18} /> Add my vehicle</button>
    </section>
  );
}

function GarageView({ vehicle, itemCount, buildTotal, budget, onFindMods, onOpenBuild }: { vehicle: Vehicle; itemCount: number; buildTotal: number; budget: number; onFindMods: () => void; onOpenBuild: () => void }) {
  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  return (
    <>
      <div className="page-heading"><div><span className="micro-label">MY GARAGE</span><h1>Ready to build?</h1><p>Everything for {displayName} starts here.</p></div><button className="button button-secondary desktop-action" onClick={onFindMods}>Browse modifications <ArrowRight size={17} /></button></div>
      <section className="garage-vehicle-card">
        <div className="garage-vehicle-art"><span className="scan-line" /><CarFront size={122} strokeWidth={0.95} /></div>
        <div className="garage-vehicle-details"><span className="status-chip"><span /> ACTIVE VEHICLE</span><h2>{displayName}</h2><p>{vehicle.year} {vehicle.make} {vehicle.model}{vehicle.trim ? ` · ${vehicle.trim}` : ""}</p><div className="vehicle-specs"><span><b>ENGINE</b>{vehicle.engine || "Not added"}</span><span><b>DRIVETRAIN</b>Verify trim</span><span><b>BUILD STATUS</b>Planning</span></div></div>
        <button className="button button-primary mobile-card-action" onClick={onFindMods}>Find mods <ArrowRight size={17} /></button>
      </section>
      <section className="metric-grid">
        <button className="metric-card" onClick={onOpenBuild}><span className="metric-icon blue"><Package /></span><span><b>{itemCount}</b> planned parts</span><ArrowRight size={17} /></button>
        <button className="metric-card" onClick={onOpenBuild}><span className="metric-icon green"><CircleDollarSign /></span><span><b>{money.format(buildTotal)}</b> build total</span><ArrowRight size={17} /></button>
        <button className="metric-card" onClick={onOpenBuild}><span className="metric-icon purple"><Gauge /></span><span><b>{budget ? money.format(budget) : "Set one"}</b> budget</span><ArrowRight size={17} /></button>
      </section>
      <section className="category-panel"><div className="section-heading"><div><span className="micro-label">BUILD PATHS</span><h2>Choose where to start</h2></div><button className="text-button" onClick={onFindMods}>View all <ArrowRight size={15} /></button></div><div className="category-grid">{MOD_CATEGORIES.map((name, index) => <button key={name} onClick={onFindMods}><span>{String(index + 1).padStart(2, "0")}</span><strong>{name}</strong><ArrowRight size={16} /></button>)}</div></section>
    </>
  );
}

function ModsView({ vehicle, parts, category, search, onCategory, onSearch, onAdd }: { vehicle: Vehicle; parts: CatalogPart[]; category: ModCategory | "All"; search: string; onCategory: (category: ModCategory | "All") => void; onSearch: (value: string) => void; onAdd: (part: CatalogPart) => void }) {
  return (
    <>
      <div className="page-heading"><div><span className="micro-label">FIND MODS</span><h1>Build the next version.</h1><p>Planning options for your {vehicle.year} {vehicle.make} {vehicle.model}.</p></div></div>
      <div className="fitment-banner"><ShieldCheck size={20} /><div><strong>Vehicle selected</strong><span>Confirm the exact part number and fitment with the seller before purchasing.</span></div></div>
      <div className="mod-toolbar"><label className="search-box"><Search size={18} /><span className="sr-only">Search modifications</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search parts or brands" /></label><div className="category-tabs"><button className={category === "All" ? "active" : ""} onClick={() => onCategory("All")}>All</button>{MOD_CATEGORIES.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => onCategory(item)}>{item}</button>)}</div></div>
      <div className="parts-grid">{parts.map((part) => <article className="part-card" key={part.id}><div className="part-card-top"><span className="part-number">{part.category}</span><span className={`difficulty ${part.difficulty.toLowerCase()}`}>{part.difficulty}</span></div><div className="part-icon"><Wrench size={28} /></div><h2>{part.name}</h2><p className="part-brand">{part.brand} · {part.vendor}</p><p className="part-note">{part.note}</p><div className="part-price"><div><span>PART</span><strong>{money.format(part.price)}</strong></div><div><span>EST. INSTALL</span><strong>{money.format(part.installCost)}</strong></div></div><button className="button button-primary button-full" onClick={() => onAdd(part)}><Plus size={17} /> Add to build</button></article>)}</div>
    </>
  );
}

function BuildView({ vehicle, build, items, partsTotal, laborTotal, total, remaining, onAddCustom, onRemove, onBudget }: { vehicle: Vehicle; build?: Build; items: BuildItem[]; partsTotal: number; laborTotal: number; total: number; remaining: number; onAddCustom: () => void; onRemove: (id: string) => void; onBudget: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <>
      <div className="page-heading"><div><span className="micro-label">MY BUILD</span><h1>{build?.name ?? "Build plan"}</h1><p>{vehicle.year} {vehicle.make} {vehicle.model}{vehicle.trim ? ` · ${vehicle.trim}` : ""}</p></div><button className="button button-primary desktop-action" onClick={onAddCustom}><Plus size={17} /> Add custom part</button></div>
      <section className="build-summary"><div className="build-total-block"><span>PROJECTED TOTAL</span><strong>{money.format(total)}</strong><p>{items.length} {items.length === 1 ? "item" : "items"} planned</p></div><div className="summary-split"><div><span>PARTS</span><strong>{money.format(partsTotal)}</strong></div><div><span>INSTALLATION</span><strong>{money.format(laborTotal)}</strong></div><div className={remaining < 0 ? "over-budget" : ""}><span>BUDGET REMAINING</span><strong>{build?.budget ? money.format(remaining) : "Not set"}</strong></div></div><form className="budget-form" onSubmit={onBudget}><label htmlFor="budget">BUILD BUDGET</label><div><span>$</span><input id="budget" name="budget" type="number" min="0" step="1" defaultValue={build?.budget || ""} placeholder="8000" /><button className="button button-secondary button-small">Save</button></div></form></section>
      {items.length === 0 ? <section className="empty-build"><Package size={42} /><h2>Your build sheet is clean.</h2><p>Add a catalog option or enter a custom part to start pricing the project.</p><button className="button button-primary" onClick={onAddCustom}><Plus size={17} /> Add custom part</button></section> : <section className="build-list"><div className="build-list-head"><span>PART</span><span>CATEGORY</span><span>COST</span><span>STATUS</span><span /></div>{items.map((item) => <article key={item.id}><div><strong>{item.part_name}</strong><span>{item.brand || item.vendor || "Custom part"}</span></div><span className="table-category">{item.category}</span><strong>{money.format(item.price + item.install_cost)}</strong><span className="status-chip"><span /> {item.status}</span><button className="icon-button danger" aria-label={`Remove ${item.part_name}`} onClick={() => onRemove(item.id)}><Trash2 size={17} /></button></article>)}</section>}
      <button className="floating-add mobile-only" aria-label="Add custom part" onClick={onAddCustom}><Plus size={22} /></button>
    </>
  );
}

function ModalShell({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><button className="icon-button modal-close" aria-label="Close" onClick={onClose}><X size={20} /></button><span className="micro-label">{eyebrow}</span><h2>{title}</h2>{children}</section></div>;
}

function AuthModal({
  mode,
  busy,
  message,
  onClose,
  onModeChange,
  onForgotPassword,
  onSubmit,
}: {
  mode: AuthMode;
  busy: boolean;
  message: string;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onForgotPassword: (email: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <ModalShell
      title={mode === "signup" ? "Create your garage" : "Welcome back"}
      eyebrow={mode === "signup" ? "START BUILDING" : "SIGN IN"}
      onClose={onClose}
    >
      <form className="stacked-form" onSubmit={onSubmit}>
        {mode === "signup" && (
          <label>
            <span>YOUR NAME</span>
            <input name="fullName" autoComplete="name" required placeholder="Your name" />
          </label>
        )}
        <label>
          <span>EMAIL</span>
          <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        <label>
          <span>PASSWORD</span>
          <input
            name="password"
            type="password"
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            placeholder="8+ characters"
          />
        </label>
        {mode === "signin" && (
          <button
            type="button"
            className="forgot-link"
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (!form) return;
              const email = String(new FormData(form).get("email") ?? "").trim();
              onForgotPassword(email);
            }}
          >
            Forgot password?
          </button>
        )}
        {mode === "signup" && (
          <div className="legal-consent-group">
            <label className="legal-consent">
              <input name="termsAccepted" type="checkbox" required />
              <span>I agree to the <Link href="/legal/terms/" target="_blank">Beta Terms of Use</Link>.</span>
            </label>
            <label className="legal-consent">
              <input name="privacyAccepted" type="checkbox" required />
              <span>I have read the <Link href="/legal/privacy/" target="_blank">Privacy Notice</Link>.</span>
            </label>
          </div>
        )}
        {message && <p className="form-message">{message}</p>}
        <button className="button button-primary button-full" disabled={busy}>
          {busy ? "Working…" : mode === "signup" ? "Create free account" : "Sign in"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="modal-switch">
        {mode === "signup" ? "Already have an account?" : "New to ModMatch Auto?"}
        <button onClick={() => onModeChange(mode === "signup" ? "signin" : "signup")}>
          {mode === "signup" ? "Sign in" : "Create account"}
        </button>
      </p>
    </ModalShell>
  );
}

function ConfirmationModal({
  email,
  busy,
  message,
  onResend,
  onSignIn,
  onClose,
}: {
  email: string;
  busy: boolean;
  message: string;
  onResend: () => void;
  onSignIn: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title="Check your email" eyebrow="ONE LAST STEP" onClose={onClose}>
      <div className="confirmation-copy">
        <p>We sent a confirmation link to:</p>
        <strong className="confirmation-email">{email}</strong>
        <p>Tap the link in that email to activate your ModMatch Auto garage.</p>
        <div className="confirmation-actions">
          <button className="button button-secondary button-full" disabled={busy} onClick={onResend}>
            {busy ? "Resending…" : "Resend confirmation email"}
          </button>
          <button className="text-button confirmation-signin" onClick={onSignIn}>
            Already confirmed? Sign in
          </button>
        </div>
        {message && <p className="form-message">{message}</p>}
      </div>
    </ModalShell>
  );
}

function PasswordResetModal({
  busy,
  message,
  onSubmit,
  onClose,
}: {
  busy: boolean;
  message: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title="Choose a new password" eyebrow="ACCOUNT RECOVERY" onClose={onClose}>
      <form className="stacked-form" onSubmit={onSubmit}>
        <label>
          <span>NEW PASSWORD</span>
          <input name="password" type="password" minLength={8} autoComplete="new-password" required placeholder="8+ characters" />
        </label>
        <label>
          <span>CONFIRM PASSWORD</span>
          <input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required placeholder="Repeat your password" />
        </label>
        {message && <p className="form-message">{message}</p>}
        <button className="button button-primary button-full" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </ModalShell>
  );
}

function VehicleModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <ModalShell title="Add a vehicle" eyebrow="MY GARAGE" onClose={onClose}><form className="stacked-form form-grid" onSubmit={onSubmit}><label><span>YEAR</span><input name="year" type="number" min="1886" max="2100" required placeholder="2020" /></label><label><span>MAKE</span><input name="make" required placeholder="Mercedes-Benz" /></label><label><span>MODEL</span><input name="model" required placeholder="E350" /></label><label><span>TRIM</span><input name="trim" placeholder="Base" /></label><label className="span-two"><span>ENGINE</span><input name="engine" placeholder="2.0L turbo" /></label><label className="span-two"><span>NICKNAME (OPTIONAL)</span><input name="nickname" placeholder="The daily" /></label><button className="button button-primary button-full span-two"><Plus size={17} /> Add to garage</button></form></ModalShell>;
}

function CustomPartModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <ModalShell title="Add a custom part" eyebrow="BUILD SHEET" onClose={onClose}><form className="stacked-form form-grid" onSubmit={onSubmit}><label className="span-two"><span>PART NAME</span><input name="partName" required placeholder="19-inch wheel package" /></label><label><span>CATEGORY</span><select name="category">{MOD_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>BRAND</span><input name="brand" placeholder="Brand" /></label><label><span>PART PRICE</span><input name="price" type="number" min="0" step="0.01" required placeholder="1700" /></label><label><span>INSTALL COST</span><input name="installCost" type="number" min="0" step="0.01" placeholder="200" /></label><label className="span-two"><span>VENDOR</span><input name="vendor" placeholder="Store or seller" /></label><label className="span-two"><span>PRODUCT LINK</span><input name="productUrl" type="url" placeholder="https://" /></label><label className="span-two"><span>FITMENT / INSTALL NOTES</span><textarea name="notes" rows={3} placeholder="Offset, tire size, required hardware…" /></label><button className="button button-primary button-full span-two"><Plus size={17} /> Add to build</button></form></ModalShell>;
}


function FeedbackModal({
  busy,
  message,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  message: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <ModalShell title="Help improve ModMatch Auto" eyebrow="BETA FEEDBACK" onClose={onClose}>
      <form className="stacked-form feedback-form" onSubmit={onSubmit}>
        <label>
          <span>HOW WOULD YOU RATE THE EXPERIENCE?</span>
          <select name="rating" defaultValue="5" required>
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Good</option>
            <option value="3">3 — Okay</option>
            <option value="2">2 — Needs work</option>
            <option value="1">1 — Difficult to use</option>
          </select>
        </label>
        <label>
          <span>WHAT BEST DESCRIBES YOU?</span>
          <select name="role" defaultValue="">
            <option value="">Choose one</option>
            <option value="Car enthusiast">Car enthusiast</option>
            <option value="DIY mechanic">DIY mechanic</option>
            <option value="Professional mechanic">Professional mechanic</option>
            <option value="Shop owner">Shop owner</option>
            <option value="New to modifying cars">New to modifying cars</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>
          <span>WHAT DID YOU LIKE?</span>
          <textarea name="liked" rows={3} placeholder="What should we keep?" />
        </label>
        <label>
          <span>WHAT WAS CONFUSING OR HARD TO USE?</span>
          <textarea name="confusing" rows={3} placeholder="Tell us where you got stuck." />
        </label>
        <label>
          <span>WHAT FEATURE IS MISSING?</span>
          <textarea name="missing" rows={3} placeholder="VIN lookup, real fitment, more parts, photos, sharing..." />
        </label>
        <label>
          <span>WOULD YOU USE MODMATCH AUTO AGAIN?</span>
          <select name="wouldUse" defaultValue="">
            <option value="">Not sure yet</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label>
          <span>EMAIL (OPTIONAL)</span>
          <input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </label>
        {message && <p className="form-message">{message}</p>}
        <button className="button button-primary button-full" disabled={busy}>
          {busy ? "Sending…" : "Send feedback"}
        </button>
      </form>
    </ModalShell>
  );
}
