# AutoRep — Autonomous Fitness Hardware

## 1. Project Folder Structure

```text
autorep/
├── index.html          # Frontend catalog, AI R&D Lab & local archive (DE / EN)
├── package.json        # Installs @google/genai SDK
├── api/
│   └── invent.js       # Lightweight Gemini 4 Hydrogen proxy (keeps API key hidden)
├── images/             # Studio product & hero photos (.jpg)
│   ├── hero.jpg
│   ├── solocycle.jpg
│   ├── flexmat.jpg
│   └── ghostrack.jpg
├── .env                # Local API key (ignored by Git)
└── .gitignore
```

---

## 2. Running Locally (Linux Mint)

1. Create a `.env` file in the main project folder with your Google AI Studio key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

2. Install the SDK and start the local dev environment:

```bash
npm install
npx vercel dev
```

3. Open `http://localhost:3000`.

---

## 3. Deploying on GitHub & Vercel

1. Make sure `.env` and `node_modules/` are listed in `.gitignore`, then push the folder to GitHub.
2. Import the repository on [vercel.com](https://vercel.com).
3. Under **Environment Variables**, add `GEMINI_API_KEY` (keep it private/sensitive) and click **Deploy**.
