# ModMatch Auto

**See It. Price It. Build It.**

ModMatch Auto is a mobile-first vehicle build planner. Drivers can create a private garage, plan modifications, record fitment notes, estimate installation, and track the complete cost of a build.

## MVP features

- Email account creation and sign-in
- Private multi-vehicle garage
- Year, make, model, trim, and engine details
- Modification catalog and category filters
- Custom parts, vendor links, and fitment notes
- Parts, installation, total, and budget calculations
- Supabase persistence with row-level security

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the Supabase project URL and publishable key.
3. Install dependencies with `pnpm install`.
4. Start development with `pnpm dev`.

The database schema is stored in `supabase/migrations`.

## Stack

Next.js, React, TypeScript, Tailwind CSS, Supabase, and Vercel.
