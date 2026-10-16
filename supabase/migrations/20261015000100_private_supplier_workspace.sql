-- Private supplier workspace: all rows belong to the signed-in Supabase user.
-- This migration does not publish any supplier products or enable checkout.
create table if not exists public.supplier_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  status text not null default 'prospect' check (status in ('prospect','contacted','applied','pending','approved','declined')),
  website text not null default '' check (char_length(website) <= 500),
  catalog_access text not null default 'none' check (catalog_access in ('none','csv','api','sftp','manual')),
  reseller_permission text not null default 'unconfirmed' check (reseller_permission in ('unconfirmed','approved','restricted','declined')),
  notes text not null default '' check (char_length(notes) <= 2500),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id, owner_id),
  unique (owner_id, name)
);
create index if not exists supplier_accounts_owner_idx on public.supplier_accounts(owner_id, updated_at desc);

create table if not exists public.supplier_catalog_products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  supplier_id uuid not null,
  supplier_sku text not null check (char_length(supplier_sku) between 1 and 120),
  manufacturer_part_number text not null default '' check (char_length(manufacturer_part_number) <= 120),
  brand text not null default '' check (char_length(brand) <= 120),
  product_name text not null check (char_length(product_name) between 1 and 250),
  category text not null default '' check (char_length(category) <= 120),
  vehicle_year smallint check (vehicle_year between 1886 and 2100),
  vehicle_make text not null default '' check (char_length(vehicle_make) <= 80),
  vehicle_model text not null default '' check (char_length(vehicle_model) <= 80),
  vehicle_engine text not null default '' check (char_length(vehicle_engine) <= 120),
  fitment_notes text not null default '' check (char_length(fitment_notes) <= 1500),
  fitment_verified boolean not null default false,
  inventory_status text not null default 'unknown' check (inventory_status in ('unknown','in_stock','limited','backorder','out_of_stock')),
  wholesale_cost numeric(12,2) check (wholesale_cost >= 0),
  proposed_retail_price numeric(12,2) check (proposed_retail_price >= 0),
  data_rights_verified boolean not null default false,
  publish_status text not null default 'internal_preview' check (publish_status = 'internal_preview'),
  source_file text not null default '' check (char_length(source_file) <= 250),
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, supplier_id, supplier_sku),
  constraint supplier_catalog_owner_fk foreign key (supplier_id, owner_id)
    references public.supplier_accounts (id, owner_id) on delete cascade
);
create index if not exists supplier_products_supplier_idx on public.supplier_catalog_products(owner_id, supplier_id);
create index if not exists supplier_products_vehicle_idx on public.supplier_catalog_products(owner_id, vehicle_year, vehicle_make, vehicle_model);

alter table public.supplier_accounts enable row level security;
alter table public.supplier_catalog_products enable row level security;

create policy supplier_accounts_select_own on public.supplier_accounts
for select to authenticated using ((select auth.uid()) = owner_id);
create policy supplier_accounts_insert_own on public.supplier_accounts
for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy supplier_accounts_update_own on public.supplier_accounts
for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy supplier_accounts_delete_own on public.supplier_accounts
for delete to authenticated using ((select auth.uid()) = owner_id);

create policy supplier_products_select_own on public.supplier_catalog_products
for select to authenticated using ((select auth.uid()) = owner_id);
create policy supplier_products_insert_own on public.supplier_catalog_products
for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy supplier_products_update_own on public.supplier_catalog_products
for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy supplier_products_delete_own on public.supplier_catalog_products
for delete to authenticated using ((select auth.uid()) = owner_id);

revoke all on public.supplier_accounts, public.supplier_catalog_products from anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.supplier_accounts, public.supplier_catalog_products to authenticated;
