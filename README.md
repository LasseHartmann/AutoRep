autorep/
├── index.html          # Frontend catalog & AI R&D Lab
├── package.json        # Installs @google/genai SDK on Vercel & locally
├── api/
│   └── invent.js       # Serverless backend (Gemini 4 Hydrogen + Supabase)
├── images/             # Studio product & hero photos
│   ├── hero.png        # Wide shot of the empty gym facility
│   ├── solocycle.png   # SoloCycle Pro bike
│   ├── flexmat.png     # FlexMat Carbon pushup mat
│   └── ghostrack.png   # GhostRack 5000 squat rack
├── .env.example        # Safe template (committed to GitHub)
├── .env                # Your real secret keys (ignored by Git, NEVER uploaded)
├── .gitignore          # Protects .env, node_modules, and .vercel from GitHub
└── README.md


Install the SDK & start the local server:
Open a terminal in your project folder and run:

npm install
npx vercel dev


Open in browser: