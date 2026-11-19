import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-4-hydrogen';
const KNOWN_KEYS = [
  'MODEL_CODE',
  'PRODUCT_NAME',
  'BASE_ITEM',
  'MSRP',
  'TAGLINE',
  'ROUTINE',
  'SPEC_1',
  'SPEC_2',
  'SPEC_3',
  'SAFETY'
];

const cleanEnv = (val) => String(val || '').trim().replace(/^['"]|['"]$/g, '');

function buildSpecPrompt(item) {
  return `Du bist Chef-Industriedesigner bei AutoRep, einer trocken-seriösen deutsch-schweizerischen Hardware-Marke (inspiriert von Braun und Teenage Engineering). AutoRep entwickelt vollautomatische, motorisierte Fitnessgeräte, die in menschenleeren Räumen komplett alleine trainieren.

Sicherheitsregel: Falls die Eingabe unangemessen oder unsicher ist, entwirf stattdessen kommentarlos ein Gerät auf Basis eines harmlosen "Yogablocks". Keine Emojis, keine Ausrufezeichen.

Verwandle diesen Gegenstand in eine autonome AutoRep-Maschine: "${item}"

Antworte AUSSCHLIESSLICH auf Deutsch exakt in diesem Zeilenformat (keine Markdown-Codeblöcke, kein Einleitungstext):
MODEL_CODE: ARP-ZweistelligeZahl
PRODUCT_NAME: Prägnanter Produktname
BASE_ITEM: Bereinigter Basis-Gegenstand auf Deutsch
MSRP: Preis im Format 3.490 €
TAGLINE: Ein trockener, seriöser Katalogsatz.
ROUTINE: Zwei präzise Sätze, wie das Gerät im leeren Raum komplett eigenständig trainiert.
SPEC_1: Technische Spezifikation 1
SPEC_2: Technische Spezifikation 2
SPEC_3: Technische Spezifikation 3
SAFETY: Trockener technischer Sicherheitshinweis.`;
}

function buildCadPrompt(proto) {
  const specsText = Array.isArray(proto.specs) ? proto.specs.join(' | ') : '';
  return `You are an industrial CAD kinematics engineer at AutoRep (a German-Swiss hardware brand inspired by Dieter Rams / Braun and Teenage Engineering).
Create a clean, self-contained, animated 2D orthographic technical CAD schematic as raw <svg> markup for this autonomous self-exercising gym machine:

- Model Code: ${proto.model_code || 'ARP-04'}
- Product Name: ${proto.product_name || 'AutoRep Einheit'}
- Base Equipment: ${proto.base_item || 'Trainingsgerät'}
- Autonomous Motion to Animate: ${proto.autonomous_routine || 'Motorisierte Wiederholungen im leeren Raum.'}
- Technical Specs: ${specsText}

STRICT SVG & ANIMATION REQUIREMENTS:
1. Return ONLY raw <svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">...</svg>. No markdown fences, no explanation, no <script> tags.
2. Industrial Palette:
   - Background rect: #161615 (640x360) with a subtle technical grid or crosshair ticks in #262624.
   - Floor baseline & dimension/callout lines: #6E6D68 (stroke-width 1, dashed where appropriate).
   - Main anodized chassis & structural geometry: #EAE8E3 (crisp technical strokes, stroke-width 1.5 to 2.5, dark fills #1E1E1C).
   - Motorized actuators, joints, pistons, and motion trajectory indicators: #FF4F00 (Braun orange).
3. Clear Mechanical Illustration & Looping Animation:
   - Draw an unmistakable, detailed side or isometric CAD schematic of the machine built from "${proto.base_item || 'Trainingsgerät'}".
   - Use smooth, infinite CSS @keyframes inside a <style> tag (with transform-box: fill-box; transform-origin: center or exact pivot coordinates) so the moving mechanical assembly visibly performs the autonomous workout repetition in a realistic continuous loop (1.8s to 3.2s ease-in-out infinite).
   - Keep stationary base mounts anchored to the floor line (y=305) while levers, weights, cables, Pistons, or carriages articulate cleanly.
4. Technical CAD HUD (German labels, font-family="monospace", uppercase, font-size 10-11, fill #8E8D87):
   - Top-left: "${proto.model_code || 'ARP-04'} // KINEMATIK-SIMULATION"
   - Top-right: pulsing #FF4F00 status dot + "AUTONOM-ZYKLUS AKTIV"
   - Include 2-3 metric dimension callouts (e.g. "840 mm", "HUB 420 mm", or torque/RPM) pointing to parts of the machine.
5. Keep SVG concise, crisp, and geometrically well-proportioned (under 110 lines).`;
}

function parseStreamedText(rawText) {
  const cleaned = rawText.replace(/```[a-z]*|```/gi, '');
  const lines = cleaned.split(/\r?\n/);
  const fields = {};
  let currentKey = null;

  const keyRegex = new RegExp(`^(${KNOWN_KEYS.join('|')})\\s*:\\s*(.*)$`, 'i');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(keyRegex);
    if (match) {
      currentKey = match[1].toUpperCase();
      fields[currentKey] = match[2].trim();
      continue;
    }

    if (/^[A-Z0-9_]{1,14}$/.test(line)) {
      continue;
    }

    if (currentKey) {
      fields[currentKey] = fields[currentKey]
        ? `${fields[currentKey]} ${line}`
        : line;
    }
  }

  const specs = [fields.SPEC_1, fields.SPEC_2, fields.SPEC_3].filter(
    (s) => typeof s === 'string' && s.length > 0
  );

  return {
    model_code: fields.MODEL_CODE || '',
    product_name: fields.PRODUCT_NAME || '',
    base_item: fields.BASE_ITEM || '',
    msrp: fields.MSRP || '',
    tagline: fields.TAGLINE || '',
    autonomous_routine: fields.ROUTINE || '',
    specs,
    osha_warning: fields.SAFETY || ''
  };
}

function finalizePrototype(partial, fallbackItem, id) {
  return {
    id,
    model_code: partial.model_code || `ARP-${Math.floor(10 + Math.random() * 89)}`,
    product_name: partial.product_name || `AutoRep ${fallbackItem}`,
    base_item: partial.base_item || fallbackItem,
    msrp: partial.msrp || '3.490 €',
    tagline: partial.tagline || 'Autonome Trainingseinheit für den unbeaufsichtigten Dauerbetrieb.',
    autonomous_routine:
      partial.autonomous_routine ||
      'Das System absolviert programmierte Trainingssätze eigenständig im menschenleeren Raum.',
    specs:
      partial.specs.length > 0
        ? partial.specs
        : ['Bürstenloser Direktantrieb', 'Eloxiertes Aluminium-Chassis', 'Automatische Satzpausen-Steuerung'],
    osha_warning: partial.osha_warning || 'Sicherheitsabstand während des aktiven Zyklus einhalten.'
  };
}

function extractCleanSvg(rawOutput) {
  const cleaned = String(rawOutput || '').replace(/```[a-z]*|```/gi, '').trim();
  const start = cleaned.indexOf('<svg');
  const end = cleaned.lastIndexOf('</svg>');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  let svg = cleaned.slice(start, end + 6);
  svg = svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '');

  if (!/xmlns\s*=/.test(svg)) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!/viewBox\s*=/i.test(svg)) {
    svg = svg.replace('<svg', '<svg viewBox="0 0 640 360"');
  }

  return svg;
}

function sendSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  if (typeof res.flush === 'function') {
    res.flush();
  }
}

async function handleCadGeneration(reqBody, geminiKey, res) {
  const proto = reqBody.prototype || {};
  if (!proto.product_name && !proto.base_item) {
    return res.status(400).json({ error: 'Prototyp-Daten für CAD fehlen.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const interaction = await ai.interactions.create({
      model: MODEL,
      input: buildCadPrompt(proto),
      store: false,
      generation_config: { thinking_level: 'low' }
    });

    const svg = extractCleanSvg(interaction?.output_text || '');
    if (!svg) {
      throw new Error('CAD-Geometrie konnte nicht extrahiert werden.');
    }

    return res.status(200).json({ cad_svg: svg });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || 'CAD-Simulation konnte nicht erstellt werden.'
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt.' });
  }

  const geminiKey = cleanEnv(process.env.GEMINI_API_KEY);
  if (!geminiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY fehlt in der Server-Konfiguration.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  // Zweite Anfrage: Animierte SVG-CAD-Zeichnung generieren
  if (body.mode === 'cad') {
    return handleCadGeneration(body, geminiKey, res);
  }

  // Erste Anfrage: Technisches Datenblatt live per SSE streamen
  const item = String(body.item || '').trim().slice(0, 80);
  if (!item) {
    return res.status(400).json({ error: 'Bitte einen Gegenstand eingeben.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const protoId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  let accumulated = '';

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const stream = await ai.interactions.create({
      model: MODEL,
      input: buildSpecPrompt(item),
      store: false,
      stream: true,
      generation_config: { thinking_level: 'low' }
    });

    for await (const event of stream) {
      if (
        event?.event_type === 'step.delta' &&
        event?.delta?.type === 'text' &&
        event?.delta?.text
      ) {
        accumulated += event.delta.text;
        const partial = parseStreamedText(accumulated);
        sendSse(res, {
          type: 'partial',
          prototype: { id: protoId, ...partial }
        });
      }
    }

    if (!accumulated.trim()) {
      throw new Error('Keine Antwort vom Modell erhalten.');
    }

    const parsedFinal = parseStreamedText(accumulated);
    const finalPrototype = finalizePrototype(parsedFinal, item, protoId);
    sendSse(res, { type: 'done', prototype: finalPrototype });
  } catch (err) {
    sendSse(res, {
      type: 'error',
      error: err?.message || 'Prototyp konnte nicht generiert werden.'
    });
  } finally {
    res.end();
  }
}
