import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.5-flash-lite';
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

function buildPrompt(item) {
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

    // Unvollständige Schlüssel am Zeilenanfang während des Streamings überspringen
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

function sendSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  if (typeof res.flush === 'function') {
    res.flush();
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt.' });
  }

  const geminiKey = cleanEnv(process.env.GEMINI_API_KEY);
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const item = String(body.item || '').trim().slice(0, 80);

  if (!item) {
    return res.status(400).json({ error: 'Bitte einen Gegenstand eingeben.' });
  }
  if (!geminiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY fehlt in der Server-Konfiguration.' });
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
      input: buildPrompt(item),
      store: false,
      stream: true,
      generation_config: { thinking_level: 'minimal' }
    });

    for await (const event of stream) {
      if (
        event?.event_type === 'step.delta' &&
        event?.delta?.text &&
        (!event.delta.type || event.delta.type === 'text')
      ) {
        accumulated += event.delta.text;
        const partial = parseStreamedText(accumulated);
        sendSse(res, {
          type: 'partial',
          prototype: { id: protoId, ...partial }
        });
      }
    }

    const parsedFinal = parseStreamedText(accumulated);
    if (!accumulated.trim()) {
      throw new Error('Keine Antwort vom Modell erhalten.');
    }

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
