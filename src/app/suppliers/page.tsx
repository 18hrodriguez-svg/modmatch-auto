"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CarFront, CheckCircle2, CircleAlert, Database, FileSpreadsheet, Lock, PackageSearch, Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SupplierStatus = "prospect" | "contacted" | "applied" | "pending" | "approved" | "declined";
type Supplier = {
  id: string;
  owner_id: string;
  name: string;
  status: SupplierStatus;
  website: string;
  catalog_access: "none" | "csv" | "api" | "sftp" | "manual";
  reseller_permission: "unconfirmed" | "approved" | "restricted" | "declined";
  notes: string;
  created_at: string;
};
type Part = {
  id: string;
  supplier_id: string;
  supplier_sku: string;
  manufacturer_part_number: string;
  brand: string;
  product_name: string;
  category: string;
  vehicle_year: number | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_engine: string;
  fitment_notes: string;
  fitment_verified: boolean;
  wholesale_cost: number | null;
  proposed_retail_price: number | null;
  inventory_status: string;
  data_rights_verified: boolean;
};
type Imported = Omit<Part, "id" | "fitment_verified" | "inventory_status" | "data_rights_verified" | "supplier_id">;

const SUGGESTED_SUPPLIERS: Pick<Supplier,"name"|"status"|"notes"|"website">[] = [
  { name: "Detroit Axle", status: "contacted", notes: "Shop customer login exists; wholesale and product-feed approval requested. NOT yet confirmed as an authorized reseller.", website: "https://detroitaxle.com" },
  { name: "Summit / Atech Motorsports", status: "contacted", notes: "Wholesale account introduction sent; application and acceptance are pending.", website: "https://www.atechmotorsports.com" },
  { name: "Rough Country", status: "applied", notes: "Dealer application submitted by owner. Dealer approval pending.", website: "https://www.roughcountry.com" },
  { name: "Meyer Distributing", status: "contacted", notes: "New customer application information requested. Signed application not submitted yet.", website: "https://www.meyerdistributing.com" },
  { name: "O'Reilly Pro", status: "applied", notes: "Pro access request submitted and email verified; approval pending.", website: "https://www.oreillypro.com" },
  { name: "SEMA Data", status: "contacted", notes: "Reseller Launch plan inquiry sent; supplier of catalog information, not actual inventory.", website: "https://www.semadata.org" },
];

function csvRows(source: string): string[][] {
  const text = source.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], token = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { token += '"'; i++; }
      else quoted = !quoted;
    } else if (c === "," && !quoted) { row.push(token.trim()); token = ""; }
    else if ((c === "\r" || c === "\n") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(token.trim()); token = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else token += c;
  }
  if (quoted) throw Error("CSV has an unclosed quoted value.");
  row.push(token.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function parseSupplierCSV(input: string): Imported[] {
  const lines = csvRows(input);
  const headings = lines.shift()?.map(norm);
  if (!headings?.length) throw Error("No CSV header found.");
  const col = (...names: string[]) => headings.findIndex((h) => names.includes(h));
  const indexes = {
    sku: col("sku", "suppliersku", "partnumber", "partno", "itemnumber", "productsku"),
    mpn: col("mpn", "manufacturerpartnumber", "manufacturernumber"),
    name: col("productname", "title", "name", "producttitle", "description"),
    brand: col("brand", "manufacturer", "brandname"),
    category: col("category", "productcategory", "producttype", "parttype"),
    year: col("year", "vehicleyear", "modelyear"),
    make: col("make", "vehiclemake"),
    model: col("model", "vehiclemodel"),
    engine: col("engine", "vehicleengine"),
    fitment: col("fitment", "fitmentnotes", "application", "applications"),
    cost: col("wholesalecost", "dealerprice", "cost"),
    retail: col("retailprice", "sellingprice", "proposedretailprice"),
  };
  if (indexes.sku < 0 && indexes.mpn < 0) throw Error("Include a SKU, Part Number, or MPN column.");
  if (indexes.name < 0) throw Error("Include a product Name or Title column.");
  if (lines.length > 1000) throw Error("Import at most 1,000 rows per CSV. Split larger files for safety.");
  const pick = (r: string[], n: number) => n < 0 ? "" : (r[n] ?? "").trim();
  const dollars = (s: string) => {
    const value = s.trim().replace(/[$,]/g, "");
    if (!value) return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
  };
  const items = lines.map((r, i) => {
    const sku = pick(r, indexes.sku) || pick(r, indexes.mpn);
    const product_name = pick(r, indexes.name);
    if (!sku || !product_name) throw Error("Row " + (i + 2) + " is missing SKU or name.");
    const yearText = pick(r, indexes.year);
    const vehicle_year = yearText ? Number(yearText) : null;
    if (vehicle_year != null && (!Number.isInteger(vehicle_year) || vehicle_year < 1886 || vehicle_year > 2100)) throw Error("Invalid vehicle year on row " + (i + 2));
    return {
      supplier_sku: sku.slice(0, 120),
      manufacturer_part_number: pick(r, indexes.mpn).slice(0, 120),
      product_name: product_name.slice(0, 250),
      brand: pick(r, indexes.brand).slice(0, 120),
      category: pick(r, indexes.category).slice(0, 120),
      vehicle_year,
      vehicle_make: pick(r, indexes.make).slice(0, 80),
      vehicle_model: pick(r, indexes.model).slice(0, 80),
      vehicle_engine: pick(r, indexes.engine).slice(0, 120),
      fitment_notes: pick(r, indexes.fitment).slice(0, 1500),
      wholesale_cost: dollars(pick(r, indexes.cost)),
      proposed_retail_price: dollars(pick(r, indexes.retail)),
    };
  });
  const seen = new Set<string>();
  for (const part of items) {
    if (seen.has(part.supplier_sku)) throw Error("Duplicate supplier SKU: " + part.supplier_sku + ". Import one entry per supplier SKU.");
    seen.add(part.supplier_sku);
  }
  return items;
}

const money = (amount: number | null) => amount == null ? "—" : new Intl.NumberFormat("en-US", {style:"currency",currency:"USD"}).format(amount);
const field = "w-full rounded-lg border border-[#33415a] bg-[#0d1422] px-3 py-2.5 text-sm text-[#f4f7fb] placeholder:text-[#7688a3]";
const btn = "rounded-lg bg-[#2f7dff] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#478dff]";
const card = "rounded-xl border border-[#27354d] bg-[#101827] p-5";

export default function SupplierDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [fileName, setFileName] = useState("");
  const [staged, setStaged] = useState<Imported[]>([]);
  const [confirmRights, setConfirmRights] = useState(false);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [markup, setMarkup] = useState("25");

  const load = useCallback(async (uid: string) => {
    const [a, b] = await Promise.all([
      supabase.from("supplier_accounts").select("*").eq("owner_id", uid).order("created_at"),
      supabase.from("supplier_catalog_products").select("*").eq("owner_id", uid).order("imported_at", {ascending:false}).limit(1500),
    ]);
    if (a.error || b.error) {
      setMessage("Database is unavailable or the supplier migration is not installed: " + (a.error?.message || b.error?.message));
      return;
    }
    setSuppliers((a.data || []) as Supplier[]);
    setParts((b.data || []) as Part[]);
    setSelected((prev) => prev || (a.data?.[0]?.id || ""));
  }, []);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({data}) => {
      if (!mounted) return;
      const id = data.user?.id || null;
      setUserId(id);
      setReady(true);
      if (id) void load(id);
    });
    const {data: listener} = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id || null;
      if (!mounted) return;
      setUserId(id);
      setReady(true);
      if (id) void load(id);
      else {setSuppliers([]);setParts([]);setSelected("");}
    });
    return () => {mounted = false;listener.subscription.unsubscribe();};
  }, [load]);

  async function signin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);setMessage("");
    const {error} = await supabase.auth.signInWithPassword({email, password});
    setBusy(false);
    setPassword("");
    if (error) setMessage(error.message);
  }

  async function seed() {
    if (!userId) return;
    setBusy(true);setMessage("");
    const missing = SUGGESTED_SUPPLIERS.filter((entry) => !suppliers.some((s) => s.name === entry.name));
    if (!missing.length) {setMessage("All suggested suppliers are already saved.");setBusy(false);return;}
    const {error} = await supabase.from("supplier_accounts").insert(missing.map((s) => ({...s,owner_id:userId, catalog_access:"none",reseller_permission:"unconfirmed"})));
    setBusy(false);
    if (error) setMessage(error.message);
    else {setMessage("Supplier tracker saved privately.");await load(userId);}
  }

  async function addSupplier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId || !newName.trim()) return;
    setBusy(true);setMessage("");
    const {error} = await supabase.from("supplier_accounts").insert({owner_id:userId,name:newName.trim(),status:"prospect"});
    setBusy(false);
    if (error) setMessage(error.message);
    else {setNewName("");await load(userId);}
  }

  async function changeStatus(id: string, status: SupplierStatus) {
    if (!userId) return;
    const {error} = await supabase.from("supplier_accounts").update({status,updated_at:new Date().toISOString()}).eq("id",id).eq("owner_id",userId);
    if (error) setMessage(error.message);
    else await load(userId);
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const f = event.target.files?.[0];
    if (!f) return;
    setStaged([]);setMessage("");setConfirmRights(false);setFileName("");
    if (f.size > 4_000_000) {setMessage("Limit imports to 4 MB per file.");event.target.value="";return;}
    try { const products = parseSupplierCSV(await f.text());setStaged(products);setFileName(f.name); }
    catch(e){setMessage(e instanceof Error?e.message:"CSV import failed.");}
    event.target.value="";
  }

  async function saveCSV() {
    if (!userId || !selected || !confirmRights || !staged.length) return;
    setBusy(true);setMessage("");
    let processed = 0;
    for (let offset=0;offset<staged.length;offset+=75) {
      const batch = staged.slice(offset,offset+75).map((p) => ({
        ...p, owner_id:userId,supplier_id:selected, source_file:fileName.slice(0,250),
        fitment_verified:false, data_rights_verified:false, inventory_status:"unknown",
        publish_status:"internal_preview", imported_at:new Date().toISOString(),updated_at:new Date().toISOString()
      }));
      const {error} = await supabase.from("supplier_catalog_products").upsert(batch,{onConflict:"owner_id,supplier_id,supplier_sku"});
      if (error) {setMessage("Saved " + processed + " rows. Import stopped: " + error.message);setBusy(false);return;}
      processed += batch.length;
    }
    setBusy(false);setStaged([]);setFileName("");setConfirmRights(false);
    setMessage("Saved " + processed + " supplier items privately. All remain internal/unverified; none are for sale.");
    await load(userId);
  }

  const chosen = suppliers.find((s) => s.id===selected);
  const results = useMemo(() => parts.filter((p) => {
    if (selected && p.supplier_id !== selected) return false;
    const text = [p.product_name,p.supplier_sku,p.brand,p.category,p.manufacturer_part_number].join(" ").toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (year && (!p.vehicle_year || String(p.vehicle_year) !== year)) return false;
    if (make && (!p.vehicle_make || p.vehicle_make.toLowerCase() !== make.trim().toLowerCase())) return false;
    if (model && (!p.vehicle_model || p.vehicle_model.toLowerCase() !== model.trim().toLowerCase())) return false;
    return true;
  }),[parts,selected,query,year,make,model]);
  const markupRate = Math.max(0, Number(markup) || 0) / 100;

  return <main className="min-h-screen bg-[#080b12] px-4 pb-20 text-white sm:px-6">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#26324a] py-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-extrabold"><CarFront className="text-blue-400"/> MODMATCH <span className="text-blue-400">AUTO</span></Link>
        <Link href="/" className="flex items-center gap-2 text-sm text-[#adc0d8]"><ArrowLeft size={16}/> Back to site</Link>
      </header>
      <div className="py-10">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-blue-400">Owner workspace · development preview</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Supplier dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#a5b3c6]">Track wholesale account requests, privately import authorized supplier files, search parts by part number or vehicle fields, and model potential markup. No public listings or checkout are enabled.</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-600/10 px-4 py-2 text-xs font-bold text-amber-200"><Lock size={14}/> OWNER DATA ONLY · NOT A PUBLIC PARTS STORE</div>
      </div>
      {!ready ? <p className={card}>Checking account session…</p> : !userId ? (
        <section className={card+" max-w-md"}>
          <h2 className="mb-2 text-xl font-bold">Sign in with your ModMatch account</h2>
          <p className="mb-5 text-sm text-[#a5b3c6]">Use your existing ModMatch website login, not your supplier or Shop credentials. Supplier data is protected by Supabase row-level security.</p>
          <form className="space-y-3" onSubmit={signin}>
            <input className={field} value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="ModMatch email" aria-label="ModMatch email"/>
            <input className={field} value={password} onChange={e=>setPassword(e.target.value)} required type="password" placeholder="ModMatch password" aria-label="ModMatch password"/>
            <button className={btn} disabled={busy}>Sign in</button>
          </form>
        </section>
      ) : <>
        <section className="grid gap-4 md:grid-cols-3">
          <div className={card}><p className="text-xs uppercase tracking-widest text-[#96a9c3]">Saved suppliers</p><p className="mt-2 text-3xl font-black">{suppliers.length}</p></div>
          <div className={card}><p className="text-xs uppercase tracking-widest text-[#96a9c3]">Private catalog items</p><p className="mt-2 text-3xl font-black">{parts.length}</p></div>
          <div className={card}><p className="text-xs uppercase tracking-widest text-[#96a9c3]">Approved to sell</p><p className="mt-2 text-3xl font-black">0</p><p className="mt-2 text-xs text-[#8ba0bc]">No checkout or publication flow is implemented.</p></div>
        </section>
        <section className={card+" mt-5"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><h2 className="text-xl font-bold">Supplier relationships</h2><p className="mt-1 text-sm text-[#9cacc4]">Statuses are editable. An inquiry is not approval.</p></div>
            <button className={btn} disabled={busy} onClick={seed}><Plus size={14} className="mr-1 inline"/> Save suggested suppliers</button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map(s=><article key={s.id} className="rounded-xl border border-[#34415a] bg-[#0a111e] p-4">
              <h3 className="font-bold">{s.name}</h3>
              <p className="mt-2 min-h-12 text-xs leading-5 text-[#99a9c1]">{s.notes || "No notes yet."}</p>
              <label className="mt-3 block text-xs text-[#abb9cd]">Account status</label>
              <select aria-label={s.name+" status"} className={field+" mt-1"} value={s.status} onChange={e=>void changeStatus(s.id,e.target.value as SupplierStatus)} disabled={busy}>
                {["prospect","contacted","applied","pending","approved","declined"].map(v=><option key={v} value={v}>{v.replace("_"," ")}</option>)}
              </select>
              <p className="mt-2 text-xs text-amber-200">Resale permission: {s.reseller_permission}</p>
            </article>)}
          </div>
          {!suppliers.length&&<p className="mt-4 text-sm text-[#9cacc4]">Start by saving the suggested suppliers. They are not automatically treated as approved.</p>}
          <form className="mt-5 flex flex-wrap gap-2 border-t border-[#263247] pt-4" onSubmit={addSupplier}>
            <input className={field+" max-w-sm flex-1"} required value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Add another supplier" aria-label="New supplier name"/>
            <button className={btn} disabled={busy}>Add supplier</button>
          </form>
        </section>
        <section className={card+" mt-5"}>
          <h2 className="flex items-center gap-2 text-xl font-bold"><FileSpreadsheet className="text-blue-400"/> Authorized CSV catalog import</h2>
          <p className="mt-2 text-sm leading-6 text-[#9cacc4]">Files are parsed on your device and uploaded only when you explicitly confirm. Existing SKU rows are updated, and all imported items remain private drafts. Don't upload supplier-owned content without permission.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">Supplier
              <select className={field+" mt-2"} value={selected} onChange={e=>{setSelected(e.target.value);setStaged([]);}} aria-label="Select supplier">
                <option value="">Select supplier</option>
                {suppliers.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block text-sm">CSV product file
              <input className={field+" mt-2"} type="file" accept=".csv,text/csv" onChange={readFile} disabled={!selected} aria-label="Authorized supplier CSV file"/>
            </label>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#8fa2bd]">Supported columns: SKU or Part Number, Product Name, Brand, Category, MPN, Year, Make, Model, Engine, Fitment Notes, Wholesale Cost, Retail Price. Max 1,000 rows / 4 MB per file. No live inventory synchronization.</p>
          {staged.length>0&&<div className="mt-4 rounded-xl border border-[#38517b] bg-[#121e34] p-4">
            <p className="font-bold">{staged.length} CSV rows ready · {fileName}</p>
            <p className="mt-1 text-xs text-[#abc1db]">Preview: {staged.slice(0,3).map(p=>p.product_name).join(" · ")}</p>
            <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={confirmRights} onChange={e=>setConfirmRights(e.target.checked)}/><span>I confirm I am authorized to import this supplier data into my private business workspace. This does not authorize public resale, public images, or live stock claims.</span></label>
            <button className={btn+" mt-4"} disabled={!confirmRights||busy} onClick={saveCSV}>Import privately (no publishing)</button>
          </div>}
        </section>
        <section className={card+" mt-5"}>
          <h2 className="flex items-center gap-2 text-xl font-bold"><PackageSearch className="text-blue-400"/> Parts search & vehicle filter</h2>
          <p className="mt-2 text-sm text-[#98a9c2]">Search only your imported records. Vehicle fields narrow imported applications but <strong>do not verify compatibility</strong>. Engine, trim, drivetrain and other qualifiers must be checked before resale.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <label className="relative sm:col-span-4"><Search size={16} className="absolute left-3 top-3 text-[#9aabc3]"/><input className={field+" pl-10"} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search SKU, brand, or part" aria-label="Search products"/></label>
            <input className={field} inputMode="numeric" placeholder="Year (e.g. 2021)" value={year} onChange={e=>setYear(e.target.value.replace(/[^0-9]/g,"").slice(0,4))} aria-label="Vehicle year"/>
            <input className={field} placeholder="Make (e.g. GMC)" value={make} onChange={e=>setMake(e.target.value)} aria-label="Vehicle make"/>
            <input className={field} placeholder="Model (e.g. Sierra)" value={model} onChange={e=>setModel(e.target.value)} aria-label="Vehicle model"/>
            <button className="rounded-lg border border-[#33415a] px-3 text-sm" onClick={()=>{setQuery("");setYear("");setMake("");setModel("");}}>Clear filters</button>
          </div>
          <p className="mt-4 text-xs text-[#91a3bb]">Showing {results.length} of {parts.length} loaded private catalog products (up to 1,500 loaded).</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {results.slice(0,80).map(p=><article key={p.id} className="rounded-xl border border-[#34425a] bg-[#0b1320] p-4">
              <h3 className="font-bold">{p.product_name}</h3>
              <p className="mt-1 text-xs text-[#97a8bf]">{p.brand||"Unknown brand"} · SKU {p.supplier_sku}</p>
              <p className="mt-2 text-xs text-[#97a8bf]">{[p.vehicle_year,p.vehicle_make,p.vehicle_model,p.vehicle_engine].filter(Boolean).join(" ")||"No structured fitment provided"}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded bg-[#273448] px-2 py-1 text-amber-200">Fitment unverified</span><span className="rounded bg-[#273448] px-2 py-1">Inventory unknown</span><span className="rounded bg-[#273448] px-2 py-1">Not for sale</span></div>
              <p className="mt-3 text-sm text-[#c9d4e5]">Cost: {money(p.wholesale_cost)} · Proposed retail: {money(p.proposed_retail_price)}</p>
              {p.wholesale_cost != null&&<p className="mt-1 text-xs text-[#9eb7d9]">Example price with {markup}% markup: {money(Math.round(p.wholesale_cost*(1+markupRate)*100)/100)} before shipping, fees, taxes and MAP checks.</p>}
            </article>)}
          </div>
          {results.length===0&&<p className="py-8 text-center text-sm text-[#8ca0b9]">No matching products. Import a licensed CSV to begin testing.</p>}
          <label className="mt-4 flex max-w-sm flex-col gap-2 text-sm text-[#aebed2]">Hypothetical markup percentage
            <input className={field} type="number" min="0" max="1000" value={markup} onChange={e=>setMarkup(e.target.value)} aria-label="Markup percentage"/>
          </label>
        </section>
        <section className={card+" mt-5"}>
          <h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="text-[#a7f432]"/> Before sales launch</h2>
          <p className="mt-2 text-sm leading-7 text-[#acbad0]">Supplier resale authorization, product data/image permissions, verified vehicle applications, MAP compliance, shipping/returns, live stock and secure checkout are separate approvals and tasks. This development dashboard intentionally exposes no public wholesale costs or product-order functionality.</p>
        </section>
      </>}
      {message&&<div role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-[#41577a] bg-[#172339] p-4 text-sm text-[#d3e4f6]"><CircleAlert size={17}/>{message}</div>}
      <p className="mt-8 text-xs text-[#788ba4]">Private beta • data and inventory are not real-time • no live supplier connection</p>
    </div>
  </main>;
}
