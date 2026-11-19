# AutoRep — Autonome Trainingsarchitektur

AutoRep ist eine interaktive deutschsprachige Web-Anwendung für eine fiktive deutsch-schweizerische Industriedesign-Marke (inspiriert von Braun und Teenage Engineering), die vollautomatische Fitnessgeräte konstruiert, welche in menschenleeren Räumen eigenständig trainieren.

Besucher können die Serienmodelle der **Serie 01** einsehen, im **AutoRep F&E-Synthesizer** beliebige Trainingsgeräte per Echtzeit-Streaming in technische Datenblätter verwandeln, eine automatisch generierte **2D-CAD-Kinematik-Animation** betrachten und alle Entwürfe lokal im Browser-Archiv verwalten.

---

## Funktionen

- **Zweistufige KI-Pipeline mit `gemini-4-hydrogen` (`thinking_level: 'low'`):**
  1. **Stufe 01 — Echtzeit-Datenblatt (SSE-Streaming):** Streamt Modellcode, Preis, Trainingsprotokoll und Spezifikationen verzögerungsfrei Zeile für Zeile in den Browser.
  2. **Stufe 02 — Automatische CAD-Kinematik-Animation:** Direkt nach Abschluss des Datenblatts startet das Frontend automatisch einen zweiten Request, der eine maßgeschneiderte, endlos animierte **SVG-CAD-Zeichnung** der autonomen Maschine im dunklen Konstruktions-Raster erstellt.
- **Sichere Sandbox-Wiedergabe:** Jede generierte SVG-Animation läuft isoliert in einem skriptfreien `<iframe sandbox="">`, sodass CSS-Keyframes sich niemals gegenseitig überschreiben.
- **Lokales Browser-Archiv (`localStorage`):** Speichert generierte Datenblätter inklusive ihrer fertigen CAD-Animation lokal im Browser – ganz ohne externe Datenbank.

---

## Projektstruktur

Damit statische Bilder und die Serverless-Route `/api/invent` auf Vercel sauber aufgelöst werden, sollte das Projekt wie folgt aufgebaut sein:

```text
autorep-autonomous-gym/
├── api/
│   └── invent.js          # Serverless-Endpunkt (Stufe 1: SSE-Stream, Stufe 2: SVG-CAD via Gemini 4 Hydrogen)
├── images/
│   ├── hero.jpg           # Hero-Bild der Trainingshalle (empfohlen: 2816x1536)
│   ├── solocycle.jpg      # Produktbild ARP-01 SoloCycle Pro
│   ├── flexmat.jpg        # Produktbild ARP-02 FlexMat Carbon
│   └── ghostrack.jpg      # Produktbild ARP-03 GhostRack 5000
├── index.html             # Deutschsprachiges Frontend inkl. Stream-Reader, CAD-Viewport & Archiv
├── package.json           # Node-ESM-Konfiguration & @google/genai SDK
└── .env                   # Lokaler API-Key (nicht ins Git-Repository committen)
```

---

## Voraussetzungen

- **Node.js** 18 oder neuer
- **[Vercel CLI](https://vercel.com/docs/cli)** (`npm i -g vercel`) für die lokale Entwicklung
- Ein **Google Gemini API-Key** aus dem [Google AI Studio](https://aistudio.google.com/)

---

## Installation & Einrichtung

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariable anlegen

Erstelle im Hauptverzeichnis eine Datei namens `.env`:

```env
GEMINI_API_KEY="dein_gemini_api_key"
```

---

## Lokal starten

Starte die Anwendung inklusive der `/api/invent`-Serverless-Funktion über die Vercel CLI:

```bash
vercel dev
```

Öffne anschließend `http://localhost:3000` im Browser.

---

## API-Endpunkt (`/api/invent`)

Beide Stufen laufen über denselben Endpunkt `POST /api/invent`:

### 1. Datenblatt streamen (Standard)
- **Request-Body:** `{ "item": "Kettlebell" }`
- **Antwort (`text/event-stream`):**
  - `{"type": "partial", "prototype": { ... }}` — Laufende Teil-Updates während des Tippens
  - `{"type": "done", "prototype": { ... }}` — Vollständig abgeschlossenes Datenblatt

### 2. Animierte CAD-Zeichnung erstellen (`mode: "cad"`)
- **Request-Body:**
  ```json
  {
    "mode": "cad",
    "prototype": {
      "model_code": "ARP-42",
      "product_name": "Kugelschwung-Einheit",
      "base_item": "Kettlebell",
      "autonomous_routine": "...",
      "specs": ["..."]
    }
  }
  ```
- **Antwort (`application/json`):** `{ "cad_svg": "<svg ...>...</svg>" }`

---

## Deployment auf Vercel

1. Lade das Projekt in ein Git-Repository (GitHub, GitLab oder Bitbucket) hoch.
2. Importiere das Repository unter [vercel.com/new](https://vercel.com/new).
3. Hinterlege `GEMINI_API_KEY` in den Projekteinstellungen unter **Environment Variables**.
4. Klicke auf **Deploy**.
