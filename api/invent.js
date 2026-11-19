import { GoogleGenAI } from '@google/genai';

const MODELS = ['gemini-4-hydrogen', 'gemini-2.5-flash'];

const cleanEnv = (val) => String(val || '').trim().replace(/^['"]|['"]$/g, '');

function supabaseHeaders(secretKey, extra = {}) {
  const headers = { apikey: secretKey, ...extra };
  if (!secretKey.startsWith('sb_')) {
    headers.Authorization = `Bearer ${secretKey}`;
  }
  return headers;
}

function buildPrompt(item) {
  return `You are the lead industrial designer at AutoRep, a deadpan German-Swiss hardware brand (inspired by Braun and Teenage Engineering) that manufactures motorized gym equipment that works out completely by itself in empty rooms with zero humans.

School-safety rule: If the input is inappropriate or unsafe, silently redesign a harmless "Yoga Block" instead. Zero emojis, zero exclamation marks.

Convert this everyday fitness item or idea into an autonomous self-exercising AutoRep machine: "${item}"

Return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "model_code": "ARP-two-digit-number",
  "de": {
    "product_name": "Prägnanter Produktname",
    "base_item": "Übersetzter Basis-Gegenstand auf Deutsch",
    "msrp": "z. B. 3.490 €",
    "tagline": "Ein trockener, seriöser Katalogsatz auf Deutsch.",
    "autonomous_routine": "2 präzise Sätze auf Deutsch, wie das Gerät im leeren Raum komplett alleine trainiert.",
    "specs": ["Technische Spezifikation 1", "Technische Spezifikation 2", "Technische Spezifikation 3"],
    "osha_warning": "Trockener Sicherheitshinweis auf Deutsch."
  },
  "en": {
    "product_name": "Concise product name",
    "base_item": "Translated base item in English",
    "msrp": "e.g. €3,490",
    "tagline": "One deadpan industrial catalog sentence in English.",
    "autonomous_routine": "2 precise sentences in English describing how the machine exercises completely by itself in an empty room.",
    "specs": ["Technical spec 1", "Technical spec 2", "Technical spec 3"],
    "osha_warning": "Deadpan safety warning in English."
  }
}`;
}

async function generateSpecWithGemini(apiKey, item) {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(item);
  let lastErr = null;

  for (const model of MODELS) {
    try {
      const interaction = await ai.interactions.create({
        model,
        input: prompt,
        store: false,
        generation_config: { thinking_level: 'low' }
      });
      if (interaction?.output_text) {
        const cleaned = interaction.output_text.replace(/```json|```/gi, '').trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          return JSON.parse(cleaned.slice(start, end + 1));
        }
      }
    } catch (err) {
      lastErr = err;
    }
  }

  throw new Error(lastErr?.message || 'Gemini failed to generate a valid datasheet');
}

export default async function handler(req, res) {
  const geminiKey = cleanEnv(process.env.GEMINI_API_KEY);
  const supabaseUrl = cleanEnv(process.env.SUPABASE_URL).replace(/\/+$/, '');
  const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (req.method === 'GET') {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ prototypes: [] });
    }
    try {
      const dbRes = await fetch(
        `${supabaseUrl}/rest/v1/prototypes?select=*&order=created_at.desc&limit=36`,
        { headers: supabaseHeaders(supabaseKey) }
      );
      const rows = dbRes.ok ? await dbRes.json() : [];
      return res.status(200).json({ prototypes: Array.isArray(rows) ? rows : [] });
    } catch (_) {
      return res.status(200).json({ prototypes: [] });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const item = String(body.item || '').trim().slice(0, 80);
  const isGerman = body.lang !== 'en';

  if (!item) {
    return res.status(400).json({
      error: isGerman ? 'Bitte einen Gegenstand eingeben.' : 'Please enter an item.'
    });
  }
  if (!geminiKey) {
    return res.status(500).json({
      error: isGerman ? 'GEMINI_API_KEY fehlt.' : 'Missing GEMINI_API_KEY.'
    });
  }

  try {
    const spec = await generateSpecWithGemini(geminiKey, item);
    const de = spec.de || spec.en || {};
    const en = spec.en || spec.de || {};

    const deBlock = {
      product_name: de.product_name || `AutoRep ${item}`,
      base_item: de.base_item || item,
      msrp: de.msrp || '3.490 €',
      tagline: de.tagline || '',
      autonomous_routine: de.autonomous_routine || '',
      specs: Array.isArray(de.specs) ? de.specs.slice(0, 3) : [],
      osha_warning: de.osha_warning || 'Sicherheitsabstand einhalten.'
    };

    const enBlock = {
      product_name: en.product_name || deBlock.product_name,
      base_item: en.base_item || item,
      msrp: en.msrp || '€3,490',
      tagline: en.tagline || deBlock.tagline,
      autonomous_routine: en.autonomous_routine || deBlock.autonomous_routine,
      specs: Array.isArray(en.specs) ? en.specs.slice(0, 3) : deBlock.specs,
      osha_warning: en.osha_warning || 'Maintain safe clearance.'
    };

    const recordToInsert = {
      model_code: spec.model_code || `ARP-${Math.floor(10 + Math.random() * 89)}`,
      product_name: deBlock.product_name,
      base_item: deBlock.base_item,
      msrp: deBlock.msrp,
      tagline: deBlock.tagline,
      autonomous_routine: deBlock.autonomous_routine,
      specs: { list: deBlock.specs, i18n: { de: deBlock, en: enBlock } },
      osha_warning: deBlock.osha_warning
    };

    let savedRecord = { id: `local-${Date.now()}`, ...recordToInsert };

    if (supabaseUrl && supabaseKey) {
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/prototypes`, {
        method: 'POST',
        headers: supabaseHeaders(supabaseKey, {
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        }),
        body: JSON.stringify(recordToInsert)
      });

      if (insertRes.ok) {
        const insertedRows = await insertRes.json();
        if (insertedRows?.[0]) savedRecord = insertedRows[0];
      }
    }

    return res.status(200).json({ prototype: savedRecord });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Prototype synthesis failed' });
  }
}
