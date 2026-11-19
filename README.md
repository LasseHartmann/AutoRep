AutoRep — Autonome Trainingsarchitektur

AutoRep ist eine interaktive deutschsprachige Web-Anwendung für eine fiktive deutsch-schweizerische Industriedesign-Marke, die vollautomatische Fitnessgeräte konstruiert, welche in menschenleeren Räumen eigenständig trainieren.

Besucher können die Serienmodelle der Serie 01 einsehen, im AutoRep F&E-Synthesizer beliebige Trainingsgeräte per Echtzeit-Streaming in technische Datenblätter verwandeln und alle Entwürfe lokal im Browser-Archiv verwalten.

Funktionen

Echtzeit-Streaming (SSE): Das Backend streamt jede generierte Zeile verzögerungsfrei als Server-Sent Events (text/event-stream) direkt in das Datenblatt im Browser.

Maximale Geschwindigkeit mit gemini-3.5-flash-lite: Nutzt Googles High-Throughput-Modell gemini-3.5-flash-lite mit thinking_level: 'minimal' und einem schlanken Zeilenprotokoll ohne JSON-Overhead.

Rein deutschsprachige Oberfläche: Komplett auf Deutsch optimiert – ohne doppelte Übersetzungsgenerierung.

Lokales Browser-Archiv (localStorage): Speichert bis zu 36 generierte Prototypen automatisch im Browser, ganz ohne externe Datenbank.

Projektstruktur

Damit statische Bilder und die Serverless-Route /api/invent auf Vercel sauber aufgelöst werden, sollte das Projekt wie folgt aufgebaut sein:

autorep-autonomous-gym/
├── api/

│   └── invent.js  # Serverless-Endpunkt (SSE-Streaming mit Gemini 3.5 Flash-Lite)

├── images/

│   ├── hero.jpg           # Hero-Bild der Trainingshalle (empfohlen: 2816x1536)

│   ├── solocycle.jpg      # Produktbild ARP-01 SoloCycle Pro

│   ├── flexmat.jpg        # Produktbild ARP-02 FlexMat Carbon

│   └── ghostrack.jpg      # Produktbild ARP-03 GhostRack 5000

├── index.html             # Deutschsprachiges Frontend inkl. Stream-Reader & Archiv

├── package.json           # Node-ESM-Konfiguration & @google/genai SDK

└── .env                   # Lokaler API-Key (nicht ins Git-Repository committen)


Voraussetzungen

Node.js 18 oder neuer

Vercel CLI (npm i -g vercel) für die lokale Entwicklung

Ein Google Gemini API-Key aus dem Google AI Studio

Installation & Einrichtung

1. Abhängigkeiten installieren

npm install


2. Umgebungsvariable anlegen

Erstelle im Hauptverzeichnis eine Datei namens .env:

GEMINI_API_KEY="dein_gemini_api_key"


Lokal starten

Starte die Anwendung inklusive der /api/invent-Serverless-Funktion über die Vercel CLI:

vercel dev


Öffne anschließend http://localhost:3000 im Browser.

API-Endpunkt

POST /api/invent

Nimmt einen Basis-Gegenstand entgegen und streamt das generierte Datenblatt live über Server-Sent Events (text/event-stream).

Request-Body:

{
  "item": "Kettlebell"
}


Stream-Events (data: {...}):

{"type": "partial", "prototype": { ... }} — Laufende Teil-Updates während des Tippens

{"type": "done", "prototype": { ... }} — Vollständig abgeschlossenes Datenblatt

{"type": "error", "error": "..."} — Fehlermeldung bei ungültiger Konfiguration

Deployment auf Vercel

Lade das Projekt in ein Git-Repository (GitHub, GitLab oder Bitbucket) hoch.

Importiere das Repository unter vercel.com/new.

Hinterlege GEMINI_API_KEY in den Projekteinstellungen unter Environment Variables.

Klicke auf Deploy.
