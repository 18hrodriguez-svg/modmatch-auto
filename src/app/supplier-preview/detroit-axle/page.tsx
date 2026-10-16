"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { ArrowLeft, CarFront, FileSpreadsheet, PackageSearch, Search, ShieldCheck, UploadCloud } from "lucide-react";

type CatalogRow = {
  partNumber: string;
  name: string;
  brand: string;
  category: string;
  fitment: string;
};

const SAMPLE: CatalogRow[] = [
  { partNumber: "SAMPLE-BRK-001", name: "Front Brake Rotor & Pad Kit — Example", brand: "Sample supplier", category: "Brakes", fitment: "Vehicle compatibility must be verified" },
  { partNumber: "SAMPLE-STR-002", name: "Tie Rod & Steering Kit — Example", brand: "Sample supplier", category: "Steering", fitment: "Year/make/model alone is not enough" },
  { partNumber: "SAMPLE-SUS-003", name: "Control Arm Assembly — Example", brand: "Sample supplier", category: "Suspension", fitment: "Confirm trim, drivetrain, and application" },
];

function parseCSV(source: string): string[][] {
  const rows: string[][] = [];
  let fields: string[] = [];
  let field = "";
  let quoted = false;
  const text = source.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i += 1; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      fields.push(field.trim()); field = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      fields.push(field.trim()); field = "";
      if (fields.some(Boolean)) rows.push(fields);
      fields = [];
    } else {
      field += ch;
    }
  }
  fields.push(field.trim());
  if (fields.some(Boolean)) rows.push(fields);
  return rows;
}

function normalizeHeader(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fromSupplierCSV(source: string): CatalogRow[] {
  const [head, ...lines] = parseCSV(source);
  if (!head) return [];
  const headers = head.map(normalizeHeader);
  const column = (...names: string[]) => headers.findIndex((h) => names.includes(h));
  const skuIndex = column("manufacturernumber", "manufacturerpartnumber", "mpn", "partnumber", "sku", "productsku");
  const titleIndex = column("productname", "producttitle", "title", "name", "description");
  const brandIndex = column("brand", "manufacturer", "brandname");
  const categoryIndex = column("category", "productcategory", "parttype", "producttype");
  const fitmentIndex = column("fitment", "application", "vehicles", "vehiclefitment");
  if (skuIndex < 0 && titleIndex < 0) throw new Error("CSV needs a part number/SKU or product name/title column.");
  const value = (row: string[], i: number) => (i < 0 ? "" : (row[i] ?? "").trim());
  return lines.slice(0, 2000).map((row) => ({
    partNumber: value(row, skuIndex),
    name: value(row, titleIndex) || "Untitled supplier item",
    brand: value(row, brandIndex) || "Unspecified",
    category: value(row, categoryIndex) || "Uncategorized",
    fitment: value(row, fitmentIndex) || "Not supplied — verification required",
  })).filter((row) => row.partNumber || row.name !== "Untitled supplier item");
}

export default function DetroitAxleCatalogPreview() {
  const [records, setRecords] = useState<CatalogRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const catalog = records ?? SAMPLE;
  const categories = useMemo(() => ["All", ...Array.from(new Set(catalog.map((p) => p.category)))], [catalog]);
  const shown = catalog.filter((p) =>
    (category === "All" || p.category === category) &&
    [p.name, p.brand, p.partNumber, p.category, p.fitment].some((s) => s.toLowerCase().includes(query.trim().toLowerCase()))
  );

  async function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.size > 2_000_000) {
      setError("File is too large for this local demo. Limit: 2 MB.");
      event.target.value = "";
      return;
    }
    try {
      const rows = fromSupplierCSV(await file.text());
      if (!rows.length) throw new Error("No product rows were found.");
      setRecords(rows);
      setFileName(file.name);
      setCategory("All");
      setQuery("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to read CSV.");
    }
    event.target.value = "";
  }

  function reset() {
    setRecords(null);
    setFileName("");
    setError("");
    setCategory("All");
    setQuery("");
  }

  return (
    <main className="min-h-screen bg-[#080c13] text-[#f4f7fb]">
      <div className="mx-auto max-w-6xl px-5 pb-24">
        <header className="flex items-center justify-between gap-3 border-b border-[#253247] py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-white hover:text-blue-300">
            <CarFront className="h-6 w-6 text-blue-400" /> MODMATCH <span className="text-blue-400">AUTO</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#aab8ca] hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to ModMatch</Link>
        </header>
        <section className="py-12">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[.18em] text-blue-400">Supplier catalog · development preview</p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Detroit Axle catalog <span className="text-blue-400">proof of concept.</span></h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#aab8ca]">
            Preview a ModMatch supplier catalog using clearly marked sample rows or a CSV you have been authorized to use.
            This page is not connected to your Shop login or Detroit Axle servers.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-600/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-200">
            SAMPLE / LOCAL PREVIEW ONLY · NO LIVE INVENTORY · NOT FOR SALE
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#2a3850] bg-[#101724] p-5 md:col-span-2">
            <div className="flex items-start gap-3">
              <UploadCloud className="mt-1 h-7 w-7 shrink-0 text-blue-400" />
              <div>
                <h2 className="text-lg font-bold">Try an authorized supplier CSV</h2>
                <p className="mt-2 text-sm leading-6 text-[#aab8ca]">
                  Select a CSV file on your device. This demo reads it <strong>only in your browser</strong>.
                  It does not upload, publish, save, or sync parts. Wholesale costs and pricing columns are ignored.
                </p>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#2f7dff] px-4 py-3 text-sm font-bold text-white hover:bg-[#478dff]">
                  <FileSpreadsheet className="h-4 w-4" /> Select CSV file
                  <input className="sr-only" type="file" accept=".csv,text/csv" onChange={loadFile} aria-label="Select authorized CSV file" />
                </label>
                {fileName && <p className="mt-3 text-sm text-green-300">Loaded locally: {fileName} ({catalog.length} rows)</p>}
                {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
                <p className="mt-3 text-xs text-[#8c99ad]">
                  Supported headers include SKU/Part Number, Name/Title, Brand, Category, and Fitment.
                  No supplier credentials are needed for this preview.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-2xl border border-[#2a3850] bg-[#101724] p-5">
            <ShieldCheck className="h-7 w-7 text-[#a7f432]" />
            <h2 className="mt-3 font-bold">Before real products go live</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#aab8ca]">
              <li>✓ Confirm authorized online reseller status</li>
              <li>✓ Obtain catalog/feed use permission</li>
              <li>✓ Validate vehicle fitment</li>
              <li>✓ Verify pricing, inventory, MAP, returns</li>
              <li>✓ Set up secure checkout and fulfillment</li>
            </ul>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-[#29354a] bg-[#0d1420] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Catalog preview</h2>
              <p className="mt-1 text-sm text-[#8c99ad]">
                {records ? "Imported local preview — not published" : "Illustrative sample items — not Detroit Axle SKUs"}
              </p>
            </div>
            {records && <button onClick={reset} className="rounded-lg border border-[#34435d] px-4 py-2 text-sm text-white hover:bg-[#172033]">Reset to samples</button>}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <label className="flex min-w-[210px] flex-1 items-center gap-2 rounded-lg border border-[#34435d] bg-[#090f19] px-3">
              <Search className="h-4 w-4 text-[#90a2b9]" />
              <input aria-label="Search catalog" className="w-full bg-transparent py-3 text-sm text-white placeholder:text-[#7b8ba3] focus:outline-none" placeholder="Search parts, categories, SKU..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <select aria-label="Category" className="rounded-lg border border-[#34435d] bg-[#090f19] px-4 py-3 text-sm text-white" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option value={c} key={c}>{c}</option>)}
            </select>
          </div>
          <p className="mt-4 text-xs text-[#8998ad]">{shown.length} matching item{shown.length === 1 ? "" : "s"}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p, i) => (
              <article key={p.partNumber + i} className="rounded-xl border border-[#253249] bg-[#111a28] p-5">
                <div className="mb-4 flex h-20 items-center justify-center rounded-lg bg-[#1a2739]"><PackageSearch className="h-9 w-9 text-[#6687b5]" aria-hidden="true" /></div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#7aa9fc]">{p.category}</p>
                <h3 className="mt-2 text-base font-bold">{p.name}</h3>
                <p className="mt-3 text-sm text-[#97a6bb]">{p.brand} · {p.partNumber || "No SKU provided"}</p>
                <p className="mt-2 text-xs leading-5 text-[#97a6bb]">{p.fitment}</p>
                <p className="mt-4 rounded-md bg-[#253045] px-3 py-2 text-center text-xs font-bold text-[#d5e0f1]">Preview only · Checkout disabled</p>
              </article>
            ))}
          </div>
          {!shown.length && <p className="py-16 text-center text-sm text-[#8c99ad]">No matching products. Try another search or category.</p>}
        </section>
        <p className="mt-6 text-xs leading-6 text-[#8c99ad]">
          This is an independent ModMatch Auto development demonstration. No Detroit Axle product prices, images, availability,
          warranty coverage, online-resale authorization, or verified fitment are claimed. A Shop buyer account alone does not
          authorize catalog synchronization.
        </p>
      </div>
    </main>
  );
}
