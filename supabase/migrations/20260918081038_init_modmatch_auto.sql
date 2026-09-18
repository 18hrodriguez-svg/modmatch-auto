create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year smallint not null check (year between 1886 and 2100),
  make text not null check (char_length(make) between 1 and 80),
  model text not null check (char_length(model) between 1 and 80),
  trim text not null default '' check (char_length(trim) <= 80),
  engine text not null default '' check (char_length(engine) <= 120),
  nickname text not null default '' check (char_length(nickname) <= 80),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null,
  name text not null default 'My Build' check (char_length(name) between 1 and 100),
  status text not null default 'planning' check (status in ('planning', 'active', 'complete', 'archived')),
  budget numeric(12, 2) not null default 0 check (budget >= 0),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  constraint builds_vehicle_owner_fk
    foreign key (vehicle_id, user_id)
    references public.vehicles(id, user_id)
    on delete cascade
);

create table public.build_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  build_id uuid not null,
  category text not null check (category in ('Wheels & Tires', 'Suspension', 'Performance', 'Intake', 'Exhaust', 'Exterior', 'Lighting', 'Interior')),
  part_name text not null check (char_length(part_name) between 1 and 140),
  brand text not null default '' check (char_length(brand) <= 100),
  vendor text not null default '' check (char_length(vendor) <= 100),
  price numeric(12, 2) not null default 0 check (price >= 0),
  install_cost numeric(12, 2) not null default 0 check (install_cost >= 0),
  product_url text not null default '' check (char_length(product_url) <= 2048),
  fitment_notes text not null default '' check (char_length(fitment_notes) <= 1000),
  status text not null default 'planned' check (status in ('planned', 'ordered', 'installed')),
  created_at timestamptz not null default now(),
  constraint build_items_build_owner_fk
    foreign key (build_id, user_id)
    references public.builds(id, user_id)
    on delete cascade
);

create index vehicles_user_created_idx on public.vehicles (user_id, created_at desc);
create index builds_user_vehicle_idx on public.builds (user_id, vehicle_id);
create index builds_vehicle_owner_idx on public.builds (vehicle_id, user_id);
create index build_items_user_build_idx on public.build_items (user_id, build_id, created_at);
create index build_items_build_owner_idx on public.build_items (build_id, user_id);

alter table public.vehicles enable row level security;
alter table public.builds enable row level security;
alter table public.build_items enable row level security;

create policy "vehicle_select_own" on public.vehicles for select to authenticated using ((select auth.uid()) = user_id);
create policy "vehicle_insert_own" on public.vehicles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "vehicle_update_own" on public.vehicles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "vehicle_delete_own" on public.vehicles for delete to authenticated using ((select auth.uid()) = user_id);

create policy "build_select_own" on public.builds for select to authenticated using ((select auth.uid()) = user_id);
create policy "build_insert_own" on public.builds for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "build_update_own" on public.builds for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "build_delete_own" on public.builds for delete to authenticated using ((select auth.uid()) = user_id);

create policy "build_item_select_own" on public.build_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "build_item_insert_own" on public.build_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "build_item_update_own" on public.build_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "build_item_delete_own" on public.build_items for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.vehicles, public.builds, public.build_items from anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.vehicles, public.builds, public.build_items to authenticated;
