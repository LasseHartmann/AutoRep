AutoRep — Autonomous Fitness Hardware

1. Supabase Setup (Takes ~2 Minutes)

Step 1: Create a Free Project

Go to supabase.com, sign in, and click New Project.

Pick any name (e.g. autorep), set a database password, choose a nearby region (e.g. Central EU / Frankfurt), and wait ~60 seconds for the database to finish starting up.

Step 2: Run the Setup SQL (Creates Table + Image Bucket)

In the left sidebar of your Supabase dashboard, click SQL Editor → New query.

Paste the entire SQL block below and click Run:

-- 1. Create the shared prototypes table
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
  image_url text default '',
  created_at timestamptz not null default now()
);

-- 2. Enable Row Level Security so nobody can edit/delete rows from browser DevTools
-- (Your Vercel backend uses the service_role key, which safely bypasses RLS on the server)
alter table public.prototypes enable row level security;

drop policy if exists "Allow public read access" on public.prototypes;
create policy "Allow public read access"
  on public.prototypes
  for select
  using (true);

-- 3. Create the public Storage bucket for AI-generated studio product photos
insert into storage.buckets (id, name, public)
values ('prototypes', 'prototypes', true)
on conflict (id) do update set public = true;


You should see Success. No rows returned at the bottom. That sets up both your database table and your public prototypes image bucket automatically.

Step 3: Copy Your Two Supabase Values

Click Project Settings (gear icon at the bottom of the left sidebar).

For SUPABASE_URL: Go to Data API (or API) and copy the Project URL (looks like https://abcdefghijklm.supabase.co).

For SUPABASE_SERVICE_ROLE_KEY: Go to API Keys (or API → Project API keys), find service_role (secret), click Reveal, and copy it.
(Important: Copy the service_role secret key, not the anon public key, and never paste it into frontend files—only into .env and Vercel.)

2. Project Folder Structure

autorep/
├── index.html          # Frontend catalog & AI R&D Lab (DE / EN)
├── package.json        # Installs @google/genai SDK on Vercel & locally
├── api/
│   └── invent.js       # Serverless backend (Gemini 4 Hydrogen + Supabase)
├── images/             # Studio product & hero photos (.jpg)
│   ├── hero.jpg        # Wide shot of the empty gym facility
│   ├── solocycle.jpg   # SoloCycle Pro bike
│   ├── flexmat.jpg     # FlexMat Carbon pushup mat
│   └── ghostrack.jpg   # GhostRack 5000 squat rack
├── .env.example        # Safe template (committed to GitHub)
├── .env                # Your real secret keys (ignored by Git, NEVER uploaded)
├── .gitignore          # Protects .env, node_modules, and .vercel from GitHub
└── README.md


3. Running Locally (Linux Mint)

Copy .env.example to .env and fill in your GEMINI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY:

cp .env.example .env


Install dependencies and start the local Vercel dev server:

npm install
npx vercel dev


Open http://localhost:3000 in your browser.

4. Pushing to GitHub & Deploying on Vercel

Push your project folder to GitHub (.gitignore automatically keeps .env, node_modules/, and .vercel/ out of your repo).

Go to vercel.com → Add New Project → import your GitHub repository.

Before clicking Deploy, open Environment Variables and add all three keys:

GEMINI_API_KEY

SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

Click Deploy—your live link is ready to share with your class!
