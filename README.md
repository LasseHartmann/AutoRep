AutoRep — Autonomous Training ArchitectureAutoRep is a bilingual (German / English) interactive web experience for a fictional German-Swiss industrial hardware brand that engineers motorized fitness equipment capable of working out completely on its own in empty rooms.Visitors can browse Series 01 flagship machines, use the AutoRep R&D Synthesizer powered by Google Gemini to turn any everyday fitness item into a deadpan technical datasheet, and explore a live shared R&D Archive backed by Supabase.FeaturesBilingual Interface (DE / EN): Instant client-side language switching across UI copy, flagship catalog items, and AI-generated technical datasheets.AI R&D Synthesizer: Uses the @google/genai SDK to generate structured, bilingual product specifications, autonomous workout protocols, and safety notices.Live Shared Registry: Automatically persists generated prototypes to a Supabase PostgreSQL database and refreshes the shared archive every 15 seconds.Graceful Local Fallback: Runs smoothly even without Supabase credentials configured (falling back to temporary session prototypes) and includes built-in prompt safety guardrails.Recommended Project StructureTo ensure serverless API routing (/api/invent) and static image assets resolve properly on Vercel, organize your files as follows:autorep-autonomous-gym/
├── api/
│   └── invent.js          # Serverless endpoint (GET archive / POST new prototype)
├── images/
│   ├── hero.jpg           # Hero facility banner (16:9 / 2816x1536 recommended)
│   ├── solocycle.jpg      # ARP-01 SoloCycle Pro image
│   ├── flexmat.jpg        # ARP-02 FlexMat Carbon image
│   └── ghostrack.jpg      # ARP-03 GhostRack 5000 image
├── index.html             # Main frontend application
├── package.json           # Node ESM configuration & dependencies
└── .env                   # Local environment variables (do not commit)
Note: If your HTML file is currently named index (1).html or invent.js is in the root directory, rename index (1).html to index.html and move invent.js into api/invent.js.PrerequisitesNode.js 18+ installed locallyVercel CLI (npm i -g vercel) for running serverless functions locallyA Google Gemini API Key from Google AI StudioA Supabase project (optional for local testing, required for the persistent shared archive)Setup & Installation1. Install Dependenciesnpm install
2. Set Up the Supabase DatabaseOpen the SQL Editor in your Supabase Dashboard and run:create table if not exists public.prototypes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  model_code text not null,
  product_name text not null,
  base_item text not null,
  msrp text not null,
  tagline text not null,
  autonomous_routine text not null,
  specs jsonb not null default '{}'::jsonb,
  osha_warning text not null
);

create index if not exists prototypes_created_at_idx
  on public.prototypes (created_at desc);

alter table public.prototypes enable row level security;
3. Configure Environment VariablesCreate a .env file in the project root:GEMINI_API_KEY="your_gemini_api_key"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_secret_or_service_role_key"
VariableRequiredDescriptionGEMINI_API_KEYYesAPI key used by @google/genai to synthesize bilingual datasheets.SUPABASE_URLOptional*Your Supabase Project URL (https://<ref>.supabase.co).SUPABASE_SERVICE_ROLE_KEYOptional*Your Supabase sb_secret_... or service_role key (server-side only).*If Supabase variables are omitted, the synthesizer still generates prototypes locally, though the shared archive will remain empty on reload.Running LocallyStart the local development server using the Vercel CLI so both index.html and /api/invent are served together:vercel dev
Then open http://localhost:3000 in your browser.API ReferenceGET /api/inventFetches up to 36 of the most recently created prototypes from Supabase, ordered by created_at descending.Response: { "prototypes": [ ... ] }POST /api/inventGenerates a bilingual autonomous machine specification from a user-supplied base item and stores it in Supabase.Request Body:{
  "item": "Kettlebell",
  "lang": "de"
}
Response: { "prototype": { ... } }DeploymentPush this repository to GitHub, GitLab, or Bitbucket.Import the repository into Vercel.Add GEMINI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY under Environment Variables.Click Deploy.
