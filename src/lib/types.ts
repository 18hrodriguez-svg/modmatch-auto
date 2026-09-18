export type Vehicle = {
  id: string;
  user_id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  nickname: string;
  created_at: string;
};

export type Build = {
  id: string;
  user_id: string;
  vehicle_id: string;
  name: string;
  status: "planning" | "active" | "complete" | "archived";
  budget: number;
  created_at: string;
};

export type BuildItem = {
  id: string;
  user_id: string;
  build_id: string;
  category: ModCategory;
  part_name: string;
  brand: string;
  vendor: string;
  price: number;
  install_cost: number;
  product_url: string;
  fitment_notes: string;
  status: "planned" | "ordered" | "installed";
  created_at: string;
};

export const MOD_CATEGORIES = [
  "Wheels & Tires",
  "Suspension",
  "Performance",
  "Intake",
  "Exhaust",
  "Exterior",
  "Lighting",
  "Interior",
] as const;

export type ModCategory = (typeof MOD_CATEGORIES)[number];

export type CatalogPart = {
  id: string;
  category: ModCategory;
  name: string;
  brand: string;
  vendor: string;
  price: number;
  installCost: number;
  difficulty: "Easy" | "Moderate" | "Advanced";
  note: string;
};
