AutoRep — Autonomous Fitness Hardware

1. Supabase Setup

Create a free project at supabase.com.

Open SQL Editor → New query, paste the SQL below, and click Run:

create table if not exists public.prototypes (
  id uuid primary key default gen_random_uuid(),
  model_code text not null,
  product_name text not null,
  base_item text not null,
  msrp text not null,
  tagline text not null,
  autonomous_routine text not null,
  specs jsonb not null default '[]'::jsonb,
  osha_warning text not null,
  created_at timestamptz not null default now()
);

alter table public.prototypes enable row level security;

drop policy if exists "Allow public read access" on public.prototypes;
create policy "Allow public read access"
  on public.prototypes
  for select
  using (true);


Copy your Project URL (SUPABASE_URL) and Secret / service_role key (SUPABASE_SERVICE_ROLE_KEY) from Project Settings → API.

2. Project Folder Structure

autorep/
├── index.html          # Frontend catalog & AI R&D Lab (DE / EN)
├── package.json        # Installs @google/genai SDK
├── api/
│   └── invent.js       # Serverless backend (Gemini 4 Hydrogen + Supabase)
├── images/             # Studio product & hero photos (.jpg)
│   ├── hero.jpg
│   ├── solocycle.jpg
│   ├── flexmat.jpg
│   └── ghostrack.jpg
├── .env.example        # Safe template (committed to GitHub)
├── .env                # Secret keys (ignored by Git)
└── .gitignore


3. Running Locally (Linux Mint)

cp .env.example .env
npm install
npx vercel dev


Open http://localhost:3000.

4. Deploying on Vercel

Push your project folder to GitHub.

Import the repository on vercel.com.

Add GEMINI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY under Environment Variables (keep them private/sensitive) and click Deploy.
