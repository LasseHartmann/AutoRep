<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AutoRep — Autonome Trainingsgeräte</title>
  <link
    rel="icon"
    type="image/svg+xml"
    href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23161615'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%23FF4F00'/%3E%3C/svg%3E"
  />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
  <style>
    :root {
      --bg: #F2F0EB;
      --surface: #EAE8E3;
      --card: #F8F7F4;
      --ink: #161615;
      --muted: #6E6D68;
      --border: #D6D3CB;
      --accent: #FF4F00;
      --font-sans: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'IBM Plex Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      background-color: var(--bg);
      color: var(--ink);
      font-family: var(--font-sans);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 1180px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .hidden {
      display: none !important;
    }

    header {
      position: sticky;
      top: 0;
      z-index: 40;
      background: rgba(242, 240, 235, 0.92);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
    }

    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 68px;
      gap: 20px;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--ink);
      font-weight: 700;
      font-size: 1.125rem;
      letter-spacing: -0.02em;
    }

    .brand-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
    }

    nav {
      display: flex;
      gap: 24px;
    }

    nav a {
      text-decoration: none;
      color: var(--muted);
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.15s ease;
    }

    nav a:hover {
      color: var(--ink);
    }

    section {
      padding: 72px 0;
      border-bottom: 1px solid var(--border);
    }

    .eyebrow {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      margin-bottom: 14px;
    }

    .hero-copy {
      max-width: 780px;
      margin-bottom: 40px;
    }

    .hero-title {
      font-size: clamp(2.25rem, 5vw, 4rem);
      line-height: 1.04;
      letter-spacing: -0.03em;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .hero-lead {
      font-size: 1.125rem;
      color: var(--muted);
      max-width: 620px;
      margin-bottom: 28px;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 13px 22px;
      font-family: var(--font-sans);
      font-size: 0.925rem;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid var(--ink);
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .btn-primary {
      background: var(--ink);
      color: var(--bg);
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    .btn-secondary {
      background: transparent;
      color: var(--ink);
      border-color: var(--border);
    }

    .btn-secondary:hover {
      border-color: var(--ink);
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .media-frame {
      position: relative;
      width: 100%;
      aspect-ratio: 2816 / 1536;
      background: var(--surface);
      border: 1px solid var(--border);
      overflow: hidden;
    }

    .media-frame img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      z-index: 2;
    }

    .media-fallback {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--muted);
      z-index: 1;
    }

    .section-head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      margin-bottom: 36px;
    }

    .section-title {
      font-size: clamp(1.6rem, 3vw, 2.25rem);
      letter-spacing: -0.025em;
      font-weight: 600;
    }

    .section-desc {
      color: var(--muted);
      max-width: 520px;
      font-size: 0.975rem;
    }

    .product-grid,
    .archive-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .product-card,
    .archive-card {
      background: var(--card);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    }

    .product-card .media-frame {
      border: none;
      border-bottom: 1px solid var(--border);
    }

    .product-body {
      padding: 22px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--muted);
      margin-bottom: 8px;
    }

    .product-name {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.015em;
      margin-bottom: 8px;
    }

    .product-desc {
      color: var(--muted);
      font-size: 0.925rem;
      margin-bottom: 18px;
      flex: 1;
    }

    .spec-list {
      list-style: none;
      border-top: 1px solid var(--border);
      padding-top: 14px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      display: grid;
      gap: 6px;
    }

    .lab-grid {
      display: grid;
      grid-template-columns: 5fr 7fr;
      gap: 28px;
      align-items: start;
    }

    .lab-panel {
      background: var(--card);
      border: 1px solid var(--border);
      padding: 28px;
    }

    .field-label {
      display: block;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-bottom: 10px;
    }

    .text-input {
      width: 100%;
      padding: 13px 14px;
      font-family: var(--font-sans);
      font-size: 0.975rem;
      background: #fff;
      color: var(--ink);
      border: 1px solid var(--border);
      margin-bottom: 16px;
      outline: none;
    }

    .text-input:focus {
      border-color: var(--ink);
    }

    .lab-hint {
      font-size: 0.85rem;
      color: var(--muted);
      margin-top: 14px;
    }

    .error-box {
      margin-top: 16px;
      padding: 12px 14px;
      border: 1px solid var(--accent);
      background: rgba(255, 79, 0, 0.06);
      font-size: 0.85rem;
      word-break: break-word;
    }

    .datasheet-shell {
      position: relative;
      background: var(--card);
      border: 1px solid var(--border);
      min-height: 360px;
    }

    .datasheet-empty {
      min-height: 360px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      color: var(--muted);
    }

    .loading-overlay {
      position: absolute;
      inset: 0;
      z-index: 10;
      background: rgba(248, 247, 244, 0.94);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      text-align: center;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-dark {
      border-color: #333330;
      border-top-color: var(--accent);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .loading-text {
      font-family: var(--font-mono);
      font-size: 0.78rem;
    }

    .spec-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 14px 26px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      font-family: var(--font-mono);
      font-size: 0.75rem;
    }

    .spec-strip-left,
    .spec-strip-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      letter-spacing: 0.06em;
      color: var(--accent);
      text-transform: uppercase;
    }

    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      animation: pulse 0.9s ease-in-out infinite;
    }

    .cad-viewport {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background-color: #161615;
      background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 24px 24px;
      border-bottom: 1px solid var(--border);
      overflow: hidden;
    }

    .cad-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
      background: #161615;
    }

    .cad-status {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: #9E9D96;
    }

    .cad-retry-btn {
      margin-top: 4px;
      padding: 7px 14px;
      background: transparent;
      color: #F2F0EB;
      border: 1px solid #4A4945;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      cursor: pointer;
      transition: border-color 0.15s ease, color 0.15s ease;
    }

    .cad-retry-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }

    .detail-code {
      color: var(--accent);
      font-weight: 500;
    }

    .detail-base {
      color: var(--muted);
      text-transform: uppercase;
    }

    .detail-price {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 500;
    }

    .detail-body {
      padding: 26px;
    }

    .detail-title {
      font-size: 1.65rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 8px;
    }

    .detail-tagline {
      font-size: 1rem;
      color: var(--muted);
      margin-bottom: 20px;
    }

    .detail-section-label {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      margin-bottom: 6px;
    }

    .detail-behavior {
      font-size: 0.95rem;
      margin-bottom: 22px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }

    .numbered-specs {
      list-style: none;
      display: grid;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.78rem;
    }

    .numbered-specs li {
      display: flex;
      gap: 12px;
      align-items: baseline;
    }

    .spec-idx {
      color: var(--muted);
      min-width: 22px;
    }

    .detail-safety {
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--muted);
    }

    .placeholder-muted {
      color: var(--border);
    }

    .archive-card {
      cursor: pointer;
      transition: border-color 0.15s ease;
    }

    .archive-card:hover {
      border-color: var(--ink);
    }

    .archive-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      font-family: var(--font-mono);
      font-size: 0.75rem;
    }

    .archive-card-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .archive-card-base {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-bottom: 6px;
    }

    .archive-card-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cad-tag {
      color: var(--accent);
      font-size: 0.68rem;
    }

    .archive-empty {
      padding: 48px 24px;
      border: 1px dashed var(--border);
      text-align: center;
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      color: var(--muted);
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 60;
      background: rgba(22, 22, 21, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      background: var(--card);
      border: 1px solid var(--ink);
      max-width: 720px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--muted);
    }

    .modal-close {
      background: none;
      border: none;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--ink);
      cursor: pointer;
      padding: 4px 8px;
    }

    footer {
      padding: 40px 0;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--muted);
    }

    .footer-inner {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 12px;
    }

    @media (max-width: 920px) {
      .product-grid,
      .archive-grid,
      .lab-grid {
        grid-template-columns: 1fr;
      }
      nav {
        display: none;
      }
    }
  </style>
</head>
<body>

  <header>
    <div class="container header-inner">
      <a href="#" class="brand">
        <span class="brand-dot"></span>
        <span>AutoRep</span>
      </a>
      <nav>
        <a href="#lineup">Geräte</a>
        <a href="#lab">F&amp;E-Labor</a>
        <a href="#archive">Archiv</a>
      </nav>
    </div>
  </header>

  <main>
    <section>
      <div class="container">
        <div class="hero-copy">
          <p class="eyebrow">Autonome Trainingsarchitektur</p>
          <h1 class="hero-title">Fitnessgeräte, die ihr Training selbst erledigen.</h1>
          <p class="hero-lead">
            Jede AutoRep-Maschine führt präzise, vollmotorisierte Trainingssätze in leeren Räumen aus. Keine menschliche Beteiligung erforderlich.
          </p>
          <div class="hero-actions">
            <a href="#lab" class="btn btn-primary">Prototyp entwickeln</a>
            <a href="#lineup" class="btn btn-secondary">Serienmodelle ansehen</a>
          </div>
        </div>

        <div class="media-frame">
          <img src="images/hero.jpg" alt="AutoRep Trainingshalle" onerror="this.style.display='none';" />
          <div class="media-fallback">images/hero.jpg</div>
        </div>
      </div>
    </section>

    <section id="lineup">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Serie 01</p>
            <h2 class="section-title">Serienmodelle</h2>
          </div>
          <p class="section-desc">
            Gefertigt aus eloxiertem Aluminium und Sichtcarbon für den unbeaufsichtigten 24-Stunden-Dauerbetrieb.
          </p>
        </div>

        <div class="product-grid" id="flagshipGrid"></div>
      </div>
    </section>

    <section id="lab">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Abteilung Produktentwicklung</p>
            <h2 class="section-title">AutoRep F&amp;E-Synthesizer</h2>
          </div>
          <p class="section-desc">
            Geben Sie ein beliebiges Trainingsgerät ein. Unser System streamt zuerst das technische Datenblatt und konstruiert anschließend automatisch eine animierte CAD-Kinematik.
          </p>
        </div>

        <div class="lab-grid">
          <div class="lab-panel">
            <form id="synthesizerForm">
              <label for="itemInput" class="field-label">Basis-Gegenstand</label>
              <input
                id="itemInput"
                type="text"
                class="text-input"
                maxlength="80"
                required
                placeholder="z. B. Kettlebell, Rudergerät, Springseil ..."
              />
              <button type="submit" id="synthesizeBtn" class="btn btn-primary" style="width: 100%;">
                Prototyp generieren
              </button>
            </form>
            <p class="lab-hint">
              Stufe 01 streamt das Datenblatt in Echtzeit. Stufe 02 berechnet im Hintergrund eine animierte 2D-CAD-Zeichnung.
            </p>
            <div id="synthErrorBox" class="error-box hidden"></div>
          </div>

          <div class="datasheet-shell">
            <div id="synthLoadingOverlay" class="loading-overlay hidden">
              <div class="spinner"></div>
              <p class="loading-text">Verbindung zu Gemini 4 Hydrogen ...</p>
            </div>
            <div id="featuredDatasheet">
              <div class="datasheet-empty">Ihr generiertes Datenblatt samt CAD-Simulation erscheint hier.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="archive">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Lokales Verzeichnis</p>
            <h2 class="section-title">Entwicklungs-Archiv</h2>
          </div>
          <button type="button" id="clearArchiveBtn" class="btn btn-secondary hidden">
            Archiv leeren
          </button>
        </div>

        <div id="archiveContainer"></div>
      </div>
    </section>
  </main>

  <div id="inspectModal" class="modal-backdrop hidden" role="dialog" aria-modal="true">
    <div class="modal-card">
      <div class="modal-top">
        <span>Technisches Datenblatt &amp; CAD-Kinematik</span>
        <button type="button" id="closeModalBtn" class="modal-close">Schließen ✕</button>
      </div>
      <div id="modalBodyContent"></div>
    </div>
  </div>

  <footer>
    <div class="container footer-inner">
      <span>AutoRep GmbH — Industrielle Autonome Trainingsarchitektur</span>
      <span>Menschlicher Zutritt zur Trainingsfläche während des Betriebs untersagt.</span>
    </div>
  </footer>

  <script>
    const ARCHIVE_STORAGE_KEY = 'autorep_local_archive';

    const FLAGSHIP_PRODUCTS = [
      {
        code: 'ARP-01',
        image: 'images/solocycle.jpg',
        name: 'SoloCycle Pro',
        price: '4.800 €',
        desc: 'Sattelloses Indoor-Bike mit Direktantrieb, das eigenständig 45-minütige Bergetappen im leeren Raum absolviert.',
        specs: ['110 U/min Dauertrittfrequenz', 'Bürstenloser 2,4-kW-Nabenmotor', 'Sattelloses Monocoque-Chassis']
      },
      {
        code: 'ARP-02',
        image: 'images/flexmat.jpg',
        name: 'FlexMat Carbon',
        price: '2.290 €',
        desc: 'Segmentierte Trainingsmatte mit internen Drehgelenken, die selbstständig saubere Sätze Liegestütze und Sit-ups ausführt.',
        specs: ['60 Liegestütze pro Minute', '3-Achsen-Torsionsscharniere', 'Rutschfeste Elastomer-Unterseite']
      },
      {
        code: 'ARP-03',
        image: 'images/ghostrack.jpg',
        name: 'GhostRack 5000',
        price: '8.900 €',
        desc: 'Hydraulisches Squat-Rack, das eine 140-kg-Langhantel in kontrolliertem Tempo hebt, absenkt und nach jedem Satz ablegt.',
        specs: ['140 kg kalibrierte Arbeitslast', 'Lineare Doppel-Hydraulikzylinder', 'Automatische Pausen-Timer']
      }
    ];

    function loadStoredArchive() {
      try {
        const parsed = JSON.parse(localStorage.getItem(ARCHIVE_STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }

    function saveStoredArchive(items) {
      let list = items.slice(0, 36);
      while (list.length > 0) {
        try {
          localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(list));
          return;
        } catch (_) {
          list = list.slice(0, list.length - 1);
        }
      }
    }

    let archiveItems = loadStoredArchive();
    let currentFeatured = null;
    let currentModalId = null;
    let cadLoadingIds = new Set();
    let cooldownRemaining = 0;
    let cooldownTimer = null;
    let isStreaming = false;

    const synthesizerForm = document.getElementById('synthesizerForm');
    const itemInput = document.getElementById('itemInput');
    const synthesizeBtn = document.getElementById('synthesizeBtn');
    const synthErrorBox = document.getElementById('synthErrorBox');
    const synthLoadingOverlay = document.getElementById('synthLoadingOverlay');
    const featuredDatasheet = document.getElementById('featuredDatasheet');
    const archiveContainer = document.getElementById('archiveContainer');
    const clearArchiveBtn = document.getElementById('clearArchiveBtn');
    const inspectModal = document.getElementById('inspectModal');
    const modalBodyContent = document.getElementById('modalBodyContent');

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function escapeAttr(value) {
      return escapeHtml(value);
    }

    function buildCadSrcdoc(svgMarkup) {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:100%;height:100%;background:#161615;overflow:hidden;display:flex;align-items:center;justify-content:center;}svg{width:100%;height:100%;display:block;}</style></head><body>${svgMarkup}</body></html>`;
    }

    function normalizePrototype(rawProto) {
      const legacyDe = rawProto?.specs?.i18n?.de || {};
      const specsList = Array.isArray(rawProto?.specs)
        ? rawProto.specs
        : Array.isArray(legacyDe.specs)
          ? legacyDe.specs
          : Array.isArray(rawProto?.specs?.list)
            ? rawProto.specs.list
            : [];

      return {
        id: rawProto?.id || '',
        model_code: rawProto?.model_code || '',
        product_name: rawProto?.product_name || legacyDe.product_name || '',
        base_item: rawProto?.base_item || legacyDe.base_item || '',
        msrp: rawProto?.msrp || legacyDe.msrp || '',
        tagline: rawProto?.tagline || legacyDe.tagline || '',
        autonomous_routine: rawProto?.autonomous_routine || legacyDe.autonomous_routine || '',
        specs: specsList,
        osha_warning: rawProto?.osha_warning || legacyDe.osha_warning || '',
        cad_svg: rawProto?.cad_svg || '',
        cad_error: rawProto?.cad_error || ''
      };
    }

    function renderFlagships() {
      document.getElementById('flagshipGrid').innerHTML = FLAGSHIP_PRODUCTS.map((item) => `
        <article class="product-card">
          <div class="media-frame">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" onerror="this.style.display='none';" />
            <div class="media-fallback">${escapeHtml(item.image)}</div>
          </div>
          <div class="product-body">
            <div class="product-meta">
              <span>${escapeHtml(item.code)}</span>
              <span>${escapeHtml(item.price)}</span>
            </div>
            <h3 class="product-name">${escapeHtml(item.name)}</h3>
            <p class="product-desc">${escapeHtml(item.desc)}</p>
            <ul class="spec-list">
              ${item.specs.map((s) => `<li>— ${escapeHtml(s)}</li>`).join('')}
            </ul>
          </div>
        </article>
      `).join('');
    }

    function formatField(value, placeholder = '—') {
      return value
        ? escapeHtml(value)
        : `<span class="placeholder-muted">${placeholder}</span>`;
    }

    function buildCadViewportMarkup(p, streaming) {
      if (streaming) {
        return `
          <div class="cad-viewport">
            <div class="cad-status">
              <span>STUFE 02 // CAD-Kinematik wartet auf Abschluss des Datenblatts ...</span>
            </div>
          </div>
        `;
      }

      if (cadLoadingIds.has(p.id)) {
        return `
          <div class="cad-viewport">
            <div class="cad-status">
              <div class="spinner spinner-dark"></div>
              <span>CAD-Kinematik-Animation wird konstruiert ...</span>
            </div>
          </div>
        `;
      }

      if (p.cad_svg) {
        return `
          <div class="cad-viewport">
            <iframe
              class="cad-iframe"
              sandbox=""
              title="CAD-Simulation ${escapeAttr(p.product_name)}"
              srcdoc="${escapeAttr(buildCadSrcdoc(p.cad_svg))}"
            ></iframe>
          </div>
        `;
      }

      return `
        <div class="cad-viewport">
          <div class="cad-status">
            <span>${escapeHtml(p.cad_error || 'Keine CAD-Kinematik für diesen Entwurf gespeichert.')}</span>
            ${p.id ? `<button type="button" class="cad-retry-btn" data-generate-cad="${escapeAttr(p.id)}">CAD-Animation generieren</button>` : ''}
          </div>
        </div>
      `;
    }

    function buildProductDetailMarkup(rawProto, streaming = false) {
      const p = normalizePrototype(rawProto);
      const specSlots = [0, 1, 2].map((idx) => p.specs[idx] || '');

      return `
        <div class="spec-strip">
          <div class="spec-strip-left">
            <span class="detail-code">${formatField(p.model_code, 'ARP-··')}</span>
            ${p.base_item ? `<span class="detail-base">/ ${escapeHtml(p.base_item)}</span>` : ''}
          </div>
          <div class="spec-strip-right">
            ${streaming ? '<span class="live-badge"><span class="live-dot"></span>Live-Synthese</span>' : ''}
            <span class="detail-price">${formatField(p.msrp, '— €')}</span>
          </div>
        </div>
        ${buildCadViewportMarkup(p, streaming)}
        <div class="detail-body">
          <h3 class="detail-title">${formatField(p.product_name, 'Modellbezeichnung wird berechnet ...')}</h3>
          <p class="detail-tagline">${formatField(p.tagline, '...')}</p>

          <p class="detail-section-label">Autonomes Trainingsprotokoll</p>
          <p class="detail-behavior">${formatField(p.autonomous_routine, '...')}</p>

          <p class="detail-section-label">Spezifikationen</p>
          <ul class="numbered-specs">
            ${specSlots.map((s, idx) => `
              <li>
                <span class="spec-idx">0${idx + 1}</span>
                <span>${formatField(s, '—')}</span>
              </li>
            `).join('')}
          </ul>

          <p class="detail-safety">Sicherheitshinweis: ${formatField(p.osha_warning, '—')}</p>
        </div>
      `;
    }

    function attachCadButtons(rootEl) {
      rootEl.querySelectorAll('[data-generate-cad]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-generate-cad');
          const target =
            (currentFeatured && String(currentFeatured.id) === String(id) && currentFeatured) ||
            archiveItems.find((x) => String(x.id) === String(id));
          if (target) {
            requestCadAnimation(target);
          }
        });
      });
    }

    function renderFeaturedDatasheet(rawProto, streaming = false) {
      currentFeatured = rawProto;
      featuredDatasheet.innerHTML = rawProto
        ? buildProductDetailMarkup(rawProto, streaming)
        : '<div class="datasheet-empty">Ihr generiertes Datenblatt samt CAD-Simulation erscheint hier.</div>';
      attachCadButtons(featuredDatasheet);
    }

    function refreshOpenViewsForId(protoId) {
      if (currentFeatured && String(currentFeatured.id) === String(protoId)) {
        const updated = archiveItems.find((x) => String(x.id) === String(protoId)) || currentFeatured;
        renderFeaturedDatasheet(updated, false);
      }
      if (currentModalId && String(currentModalId) === String(protoId)) {
        const found = archiveItems.find((x) => String(x.id) === String(protoId));
        if (found) {
          modalBodyContent.innerHTML = buildProductDetailMarkup(found, false);
          attachCadButtons(modalBodyContent);
        }
      }
      renderArchiveGrid();
    }

    async function requestCadAnimation(prototypeObj) {
      const proto = normalizePrototype(prototypeObj);
      if (!proto.id || cadLoadingIds.has(proto.id)) return;

      cadLoadingIds.add(proto.id);
      refreshOpenViewsForId(proto.id);

      try {
        const res = await fetch('/api/invent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'cad',
            prototype: {
              model_code: proto.model_code,
              product_name: proto.product_name,
              base_item: proto.base_item,
              autonomous_routine: proto.autonomous_routine,
              specs: proto.specs
            }
          })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.cad_svg) {
          throw new Error(data.error || `CAD-Generierung fehlgeschlagen (${res.status}).`);
        }

        archiveItems = archiveItems.map((item) =>
          String(item.id) === String(proto.id)
            ? { ...item, cad_svg: data.cad_svg, cad_error: '' }
            : item
        );
        if (currentFeatured && String(currentFeatured.id) === String(proto.id)) {
          currentFeatured = { ...currentFeatured, cad_svg: data.cad_svg, cad_error: '' };
        }
        saveStoredArchive(archiveItems);
      } catch (err) {
        const msg = err.message || 'CAD-Simulation fehlgeschlagen.';
        archiveItems = archiveItems.map((item) =>
          String(item.id) === String(proto.id)
            ? { ...item, cad_error: msg }
            : item
        );
        if (currentFeatured && String(currentFeatured.id) === String(proto.id)) {
          currentFeatured = { ...currentFeatured, cad_error: msg };
        }
      } finally {
        cadLoadingIds.delete(proto.id);
        refreshOpenViewsForId(proto.id);
      }
    }

    function renderArchiveGrid() {
      clearArchiveBtn.classList.toggle('hidden', archiveItems.length === 0);

      if (!archiveItems.length) {
        archiveContainer.innerHTML =
          '<div class="archive-empty">Noch keine Prototypen im Archiv. Entwickeln Sie oben den ersten Entwurf.</div>';
        return;
      }

      archiveContainer.innerHTML = `
        <div class="archive-grid">
          ${archiveItems.map((raw) => {
            const p = normalizePrototype(raw);
            const hasCad = Boolean(p.cad_svg);
            const isGeneratingCad = cadLoadingIds.has(p.id);
            return `
              <article class="archive-card" data-proto-id="${escapeAttr(p.id)}">
                <div class="archive-card-head">
                  <span class="detail-code">${escapeHtml(p.model_code)}</span>
                  <span>${escapeHtml(p.msrp)}</span>
                </div>
                <div class="archive-card-body">
                  ${p.base_item ? `<span class="archive-card-base">${escapeHtml(p.base_item)}</span>` : ''}
                  <h3 class="product-name">${escapeHtml(p.product_name)}</h3>
                  <p class="product-desc" style="margin-bottom: 0;">${escapeHtml(p.tagline)}</p>
                  <div class="archive-card-footer">
                    <span>Datenblatt öffnen →</span>
                    ${isGeneratingCad
                      ? '<span class="cad-tag">CAD LÄDT ...</span>'
                      : hasCad
                        ? '<span class="cad-tag">● CAD AKTIV</span>'
                        : ''}
                  </div>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `;

      archiveContainer.querySelectorAll('.archive-card').forEach((card) => {
        card.addEventListener('click', () => {
          const found = archiveItems.find((x) => String(x.id) === String(card.dataset.protoId));
          if (found) {
            currentModalId = found.id;
            modalBodyContent.innerHTML = buildProductDetailMarkup(found, false);
            attachCadButtons(modalBodyContent);
            inspectModal.classList.remove('hidden');
          }
        });
      });
    }

    function closeInspectModal() {
      inspectModal.classList.add('hidden');
      currentModalId = null;
      modalBodyContent.innerHTML = '';
    }

    function updateButtonState() {
      if (isStreaming) {
        synthesizeBtn.textContent = 'Synthese läuft ...';
        synthesizeBtn.disabled = true;
        return;
      }
      synthesizeBtn.textContent = cooldownRemaining > 0
        ? `Bitte ${cooldownRemaining}s warten`
        : 'Prototyp generieren';
      synthesizeBtn.disabled = cooldownRemaining > 0;
    }

    function startCooldown(seconds) {
      cooldownRemaining = seconds;
      updateButtonState();
      clearInterval(cooldownTimer);
      cooldownTimer = setInterval(() => {
        cooldownRemaining = Math.max(0, cooldownRemaining - 1);
        if (cooldownRemaining === 0) clearInterval(cooldownTimer);
        updateButtonState();
      }, 1000);
    }

    synthesizerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const baseItem = itemInput.value.trim();
      if (!baseItem || cooldownRemaining > 0 || isStreaming) return;

      synthErrorBox.classList.add('hidden');
      isStreaming = true;
      updateButtonState();
      synthLoadingOverlay.classList.remove('hidden');

      let receivedFirstChunk = false;
      let finalPrototype = null;

      try {
        const res = await fetch('/api/invent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: baseItem })
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          let errMsg = `Serverfehler (${res.status})`;
          try {
            const parsed = JSON.parse(errText);
            if (parsed.error) errMsg = parsed.error;
          } catch (_) {}
          throw new Error(errMsg);
        }

        if (!res.body) {
          throw new Error('Streaming wird von diesem Browser nicht unterstützt.');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const rawEvent of events) {
            const dataLine = rawEvent
              .split('\n')
              .find((line) => line.startsWith('data:'));
            if (!dataLine) continue;

            const payload = JSON.parse(dataLine.slice(5).trim());

            if (payload.type === 'error') {
              throw new Error(payload.error || 'Synthese fehlgeschlagen.');
            }

            if (payload.type === 'partial' && payload.prototype) {
              if (!receivedFirstChunk) {
                receivedFirstChunk = true;
                synthLoadingOverlay.classList.add('hidden');
              }
              renderFeaturedDatasheet(payload.prototype, true);
            }

            if (payload.type === 'done' && payload.prototype) {
              finalPrototype = payload.prototype;
            }
          }
        }

        if (!finalPrototype) {
          throw new Error('Datenblatt wurde unvollständig übertragen.');
        }

        synthLoadingOverlay.classList.add('hidden');
        archiveItems = [
          finalPrototype,
          ...archiveItems.filter((x) => x.id !== finalPrototype.id)
        ].slice(0, 36);
        saveStoredArchive(archiveItems);
        renderFeaturedDatasheet(finalPrototype, false);
        renderArchiveGrid();
        itemInput.value = '';
        isStreaming = false;
        startCooldown(3);

        requestCadAnimation(finalPrototype);
      } catch (err) {
        synthLoadingOverlay.classList.add('hidden');
        synthErrorBox.textContent =
          err.message || 'Prototyp konnte nicht generiert werden. Bitte prüfen Sie die Vercel-Konfiguration.';
        synthErrorBox.classList.remove('hidden');
        isStreaming = false;
        updateButtonState();
      }
    });

    clearArchiveBtn.addEventListener('click', () => {
      archiveItems = [];
      saveStoredArchive([]);
      renderArchiveGrid();
    });
    document.getElementById('closeModalBtn').addEventListener('click', closeInspectModal);
    inspectModal.addEventListener('click', (e) => {
      if (e.target === inspectModal) closeInspectModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeInspectModal();
    });

    renderFlagships();
    renderArchiveGrid();
    updateButtonState();
  </script>
</body>
</html>
