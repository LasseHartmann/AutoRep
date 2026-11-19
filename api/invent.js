/**
 * AutoRep — Vercel Serverless Endpoint (/api/invent)
 *
 * Generates bilingual (German + English) autonomous gym datasheets with gemini-4-hydrogen
 * and 16:9 studio product photography via @google/genai, synced to Supabase.
 */

import { GoogleGenAI } from '@google/genai';

const STORAGE_BUCKET = 'prototypes';

const TEXT_MODELS = [
  process.env.GEMINI_TEXT_MODEL,
  'gemini-4-hydrogen',
  'gemini-3.8-flash'
].filter(Boolean);

const IMAGE_MODELS = [
  process.env.GEMINI_IMAGE_MODEL,
  'gemini-nano-banana-2.1',
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-lite-image'
].filter(Boolean);

const LOCALIZED_COPY_SCHEMA = {
  type: 'object',
  properties: {
    base_item: { type: 'string' },
    msrp: { type: 'string' },
    tagline: { type: 'string' },
    autonomous_routine: { type: 'string' },
    specs: {
      type: 'array',
      items: { type: 'string' }
    },
    osha_warning: { type: 'string' }
  },
  required: [
    'base_item',
    'msrp',
    'tagline',
    'autonomous_routine',
    'specs',
    'osha_warning'
  ]
};

const BILINGUAL_PROTOTYPE_SCHEMA = {
  type: 'object',
  properties: {
    model_code: { type: 'string' },
    product_name: { type: 'string' },
    image_prompt: { type: 'string' },
    de: LOCALIZED_COPY_SCHEMA,
    en: LOCALIZED_COPY_SCHEMA
  },
  required: ['model_code', 'product_name', 'image_prompt', 'de', 'en']
};

const recentIpTimestamps = new Map();
const IP_COOLDOWN_MS = 6000;

function cleanEnv(value) {
  if (!value) return '';
  return String(value).trim().replace(/^["']|["']$/g, '').trim();
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown-ip';
}

function parseJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return {};
}

function getSupabaseHeaders(secretKey, extraHeaders) {
  const baseHeaders = {
    apikey: secretKey,
    'User-Agent': 'AutoRep-Server/1.0'
  };

  // Supabase sb_secret_ keys must ONLY be sent on `apikey`.
  // Legacy JWT service_role keys (eyJ...) also include `Authorization: Bearer`.
  if (!String(secretKey).startsWith('sb_')) {
    baseHeaders.Authorization = `Bearer ${secretKey}`;
  }

  return Object.assign(baseHeaders, extraHeaders || {});
}

function extractJsonObject(rawText) {
  const trimmed = String(rawText || '').trim();
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(withoutFences);
}

/**
 * Generates BOTH German ("de") and English ("en") datasheets in a single call
 * using ai.interactions.create with gemini-4-hydrogen.
 */
async function generateBilingualPrototypeSpec(ai, baseItem) {
  const systemInstruction = [
    'You are an industrial hardware designer at AutoRep, a deadpan minimalist European brand (inspired by Braun and Teenage Engineering) that builds gym equipment engineered to work out BY ITSELF with zero humans involved.',
    'Take the object provided by the user and redesign it into an over-engineered, self-exercising autonomous machine.',
    'You MUST provide complete copy in BOTH German ("de") and English ("en") so visitors can switch languages seamlessly:',
    '- In "de": write crisp, dry, idiomatic German (sachlicher Braun-Industriekatalog-Stil). Translate "base_item" naturally into German and format "msrp" in Euros (e.g. "1.850 €").',
    '- In "en": write crisp, dry English (Braun industrial catalog style). Translate "base_item" naturally into English and format "msrp" in USD (e.g. "$1,950").',
    'Strict rules:',
    '1. Keep every word strictly school-safe and appropriate for a high-school classroom presentation. If the user input is inappropriate, offensive, or unsafe, silently ignore it and redesign a harmless "Yoga Block" instead.',
    '2. Never use emojis, exclamation marks, or cheesy sci-fi buzzwords.',
    '3. "model_code" must follow ARP-XX (two digits, 04 to 99). "product_name" should be a sleek international hardware name (like SoloCycle Pro or FlexMat Carbon).',
    '4. Each "specs" array in "de" and "en" must contain exactly 3 concise mechanical specifications.',
    '5. "osha_warning" in "de" and "en" must be a dry safety note warning humans not to disturb the machine while it works out.',
    '6. "image_prompt" (strictly in ENGLISH) must describe ONLY the physical machine actively exercising by itself (bead-blasted matte silver aluminum, matte black carbon fiber, small safety-orange #FF4F00 motorized hinges or pistons in motion, no seats or handlebars for humans, zero people present, no text or labels).'
  ].join('\n');

  let lastErrorMessage = 'Unknown Gemini error';

  for (const modelName of TEXT_MODELS) {
    try {
      const interaction = await ai.interactions.create({
        model: modelName,
        system_instruction: systemInstruction,
        input: `Redesign this item into an autonomous self-exercising machine (return both German and English fields): "${baseItem}"`,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: BILINGUAL_PROTOTYPE_SCHEMA
        }
      });

      if (interaction && interaction.output_text) {
        return extractJsonObject(interaction.output_text);
      }
    } catch (err) {
      lastErrorMessage = err?.message || String(err);
      console.error(`[AutoRep] Text model ${modelName} error:`, lastErrorMessage);
    }
  }

  throw new Error(`Gemini error: ${lastErrorMessage.slice(0, 180)}`);
}

/**
 * Generates a widescreen 16:9 studio photograph on #EAE8E3 cyclorama background.
 */
async function generateStudioImage(ai, imageDescription) {
  const fullStudioPrompt = [
    `Wide commercial industrial design studio photograph of ${imageDescription}, centered cleanly in frame with generous studio margin.`,
    'Constructed from bead-blasted matte silver anodized aluminum and matte black carbon fiber with subtle safety-orange (#FF4F00) motorized mechanical hinges or linear actuators mid-workout.',
    'Built to exercise entirely on its own with zero humans in frame.',
    'Shot on a clean seamless warm light-stone grey studio cyclorama background (#EAE8E3), soft diffused overhead softbox lighting, crisp floor contact shadow, Hasselblad 85mm medium format product photography, Braun and Teenage Engineering industrial hardware aesthetic, photorealistic, no text, no watermarks.'
  ].join(' ');

  for (const modelName of IMAGE_MODELS) {
    try {
      const interaction = await ai.interactions.create({
        model: modelName,
        input: fullStudioPrompt,
        response_format: {
          type: 'image',
          mime_type: 'image/jpeg',
          aspect_ratio: '16:9'
        }
      });

      let imgBlock = interaction?.output_image;

      if ((!imgBlock || !imgBlock.data) && Array.isArray(interaction?.steps)) {
        for (const step of interaction.steps) {
          if (step.type === 'model_output' && Array.isArray(step.content)) {
            const found = step.content.find((part) => part.type === 'image' && part.data);
            if (found) {
              imgBlock = found;
              break;
            }
          }
        }
      }

      if (imgBlock && imgBlock.data) {
        const mimeType = imgBlock.mime_type || imgBlock.mimeType || 'image/jpeg';
        return {
          buffer: Buffer.from(imgBlock.data, 'base64'),
          mimeType,
          base64: imgBlock.data
        };
      }
    } catch (err) {
      console.error(`[AutoRep] Image model ${modelName} error:`, err?.message || err);
    }
  }

  return null;
}

async function uploadImageToSupabase(imageObj, modelCode, supabaseUrl, supabaseKey) {
  const cleanBaseUrl = supabaseUrl.replace(/\/+$/, '');
  const extension = imageObj.mimeType.includes('png') ? 'png' : 'jpg';
  const safeCode = String(modelCode || 'arp').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const filePath = `${Date.now()}-${safeCode}-${randomSuffix}.${extension}`;

  const uploadUrl = `${cleanBaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${filePath}`;

  let uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: getSupabaseHeaders(supabaseKey, {
      'Content-Type': imageObj.mimeType,
      'x-upsert': 'true'
    }),
    body: imageObj.buffer
  });

  if (!uploadRes.ok && (uploadRes.status === 400 || uploadRes.status === 404)) {
    await fetch(`${cleanBaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: getSupabaseHeaders(supabaseKey, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        id: STORAGE_BUCKET,
        name: STORAGE_BUCKET,
        public: true
      })
    }).catch(() => {});

    uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: getSupabaseHeaders(supabaseKey, {
        'Content-Type': imageObj.mimeType,
        'x-upsert': 'true'
      }),
      body: imageObj.buffer
    });
  }

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => '');
    throw new Error(`Supabase Storage upload failed (${uploadRes.status}): ${errText.slice(0, 100)}`);
  }

  return `${cleanBaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${filePath}`;
}

async function fetchArchiveFromSupabase(supabaseUrl, supabaseKey) {
  const cleanBaseUrl = supabaseUrl.replace(/\/+$/, '');
  const queryUrl = `${cleanBaseUrl}/rest/v1/prototypes?select=*&order=created_at.desc&limit=36`;

  const response = await fetch(queryUrl, {
    method: 'GET',
    headers: getSupabaseHeaders(supabaseKey, {
      Accept: 'application/json'
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase fetch failed (${response.status}): ${detail.slice(0, 140)}`);
  }

  return response.json();
}

async function insertPrototypeIntoSupabase(record, supabaseUrl, supabaseKey) {
  const cleanBaseUrl = supabaseUrl.replace(/\/+$/, '');
  const insertUrl = `${cleanBaseUrl}/rest/v1/prototypes`;

  const response = await fetch(insertUrl, {
    method: 'POST',
    headers: getSupabaseHeaders(supabaseKey, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }),
    body: JSON.stringify(record)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase insert failed (${response.status}): ${detail.slice(0, 140)}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : record;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const geminiApiKey = cleanEnv(process.env.GEMINI_API_KEY);
  const supabaseUrl = cleanEnv(process.env.SUPABASE_URL);
  const supabaseServiceKey = cleanEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  );
  const hasSupabase = Boolean(supabaseUrl && supabaseServiceKey);

  if (req.method === 'GET') {
    if (!hasSupabase) {
      return res.status(200).json({ prototypes: [] });
    }

    try {
      const prototypes = await fetchArchiveFromSupabase(supabaseUrl, supabaseServiceKey);
      return res.status(200).json({ prototypes });
    } catch (err) {
      console.error('[AutoRep GET /api/invent]', err?.message || err);
      // Return empty list gracefully so page load does not throw 500 if SQL table isn't created yet
      return res.status(200).json({
        prototypes: [],
        warning: err?.message || 'Supabase archive unavailable'
      });
    }
  }

  if (req.method === 'POST') {
    const body = parseJsonBody(req);
    const isGerman = body.lang !== 'en';

    if (!geminiApiKey) {
      return res.status(500).json({
        error: isGerman
          ? 'GEMINI_API_KEY fehlt in der .env Datei bzw. in Vercel.'
          : 'Missing GEMINI_API_KEY in .env or Vercel Environment Variables.'
      });
    }

    const clientIp = getClientIp(req);
    const now = Date.now();
    const lastRequestAt = recentIpTimestamps.get(clientIp) || 0;
    if (now - lastRequestAt < IP_COOLDOWN_MS) {
      const waitSec = Math.ceil((IP_COOLDOWN_MS - (now - lastRequestAt)) / 1000);
      return res.status(429).json({
        error: isGerman
          ? `Bitte ${waitSec}s warten, bevor ein weiterer Prototyp erstellt wird.`
          : `Please wait ${waitSec}s before generating another prototype.`
      });
    }
    recentIpTimestamps.set(clientIp, now);

    if (recentIpTimestamps.size > 500) {
      recentIpTimestamps.clear();
    }

    const baseItem = String(body.item || '').trim().slice(0, 60);
    if (!baseItem) {
      return res.status(400).json({
        error: isGerman
          ? 'Bitte ein Trainingsgerät oder einen Gegenstand eingeben.'
          : 'Please enter a piece of gym equipment or object.'
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      const spec = await generateBilingualPrototypeSpec(ai, baseItem);

      const deCopy = {
        base_item: spec?.de?.base_item || baseItem,
        msrp: spec?.de?.msrp || '1.490 €',
        tagline: spec?.de?.tagline || '',
        autonomous_routine: spec?.de?.autonomous_routine || '',
        specs: Array.isArray(spec?.de?.specs) ? spec.de.specs.slice(0, 3) : [],
        osha_warning: spec?.de?.osha_warning || 'Abstand zu beweglichen Mechaniken halten.'
      };

      const enCopy = {
        base_item: spec?.en?.base_item || baseItem,
        msrp: spec?.en?.msrp || '$1,590',
        tagline: spec?.en?.tagline || '',
        autonomous_routine: spec?.en?.autonomous_routine || '',
        specs: Array.isArray(spec?.en?.specs) ? spec.en.specs.slice(0, 3) : [],
        osha_warning: spec?.en?.osha_warning || 'Keep clear of moving mechanisms.'
      };

      const imageObj = await generateStudioImage(
        ai,
        spec.image_prompt || `${spec.product_name}, an autonomous self-exercising ${enCopy.base_item}`
      );

      let finalImageUrl = '';
      if (imageObj) {
        if (hasSupabase) {
          try {
            finalImageUrl = await uploadImageToSupabase(
              imageObj,
              spec.model_code,
              supabaseUrl,
              supabaseServiceKey
            );
          } catch (uploadErr) {
            console.error('[AutoRep Storage Upload]', uploadErr?.message || uploadErr);
            finalImageUrl = `data:${imageObj.mimeType};base64,${imageObj.base64}`;
          }
        } else {
          finalImageUrl = `data:${imageObj.mimeType};base64,${imageObj.base64}`;
        }
      }

      // Stores German in top-level columns + full DE/EN dictionary inside `specs` jsonb column
      const recordToSave = {
        model_code: spec.model_code || 'ARP-04',
        product_name: spec.product_name || 'AutoUnit',
        base_item: deCopy.base_item,
        msrp: deCopy.msrp,
        tagline: deCopy.tagline,
        autonomous_routine: deCopy.autonomous_routine,
        specs: {
          i18n: {
            de: deCopy,
            en: enCopy
          }
        },
        osha_warning: deCopy.osha_warning,
        image_url: finalImageUrl
      };

      if (hasSupabase) {
        try {
          const savedRow = await insertPrototypeIntoSupabase(
            recordToSave,
            supabaseUrl,
            supabaseServiceKey
          );
          return res.status(200).json({ prototype: savedRow });
        } catch (dbErr) {
          console.error('[AutoRep DB Insert]', dbErr?.message || dbErr);
        }
      }

      return res.status(200).json({
        prototype: Object.assign(
          {
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString()
          },
          recordToSave
        )
      });
    } catch (err) {
      console.error('[AutoRep POST /api/invent]', err);
      return res.status(500).json({
        error: err?.message || (isGerman ? 'Prototyp konnte nicht erstellt werden.' : 'Failed to generate prototype.')
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
