/**
 * AutoRep — Vercel Serverless Endpoint (/api/invent)
 *
 * Uses @google/genai Interactions API (gemini-4-hydrogen + native studio image generation)
 * and syncs prototypes with Supabase.
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

const PROTOTYPE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    model_code: { type: 'string' },
    product_name: { type: 'string' },
    msrp: { type: 'string' },
    tagline: { type: 'string' },
    autonomous_routine: { type: 'string' },
    specs: {
      type: 'array',
      items: { type: 'string' }
    },
    osha_warning: { type: 'string' },
    image_prompt: { type: 'string' }
  },
  required: [
    'model_code',
    'product_name',
    'msrp',
    'tagline',
    'autonomous_routine',
    'specs',
    'osha_warning',
    'image_prompt'
  ]
};

const recentIpTimestamps = new Map();
const IP_COOLDOWN_MS = 6000;

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
    apikey: secretKey
  };

  // New Supabase secret keys (sb_secret_...) must ONLY be sent on `apikey`.
  // Legacy JWT service_role keys (eyJ...) also include `Authorization: Bearer`.
  if (!String(secretKey).startsWith('sb_')) {
    baseHeaders.Authorization = `Bearer ${secretKey}`;
  }

  return Object.assign(baseHeaders, extraHeaders || {});
}

/**
 * Generates the deadpan autonomous gym datasheet JSON via ai.interactions.create.
 */
async function generatePrototypeSpec(ai, baseItem, lang) {
  const isGerman = lang !== 'en';

  const languageRules = isGerman
    ? [
        'LANGUAGE: Write "tagline", "autonomous_routine", "specs", and "osha_warning" in crisp, dry, idiomatic GERMAN (sachlicher Braun-Industriekatalog-Stil).',
        'Format "msrp" in Euros like "1.850 €" or "4.200 €".',
        'IMPORTANT: Keep "image_prompt" strictly in ENGLISH for the studio photo generator.'
      ].join(' ')
    : [
        'LANGUAGE: Write "tagline", "autonomous_routine", "specs", and "osha_warning" in crisp, dry ENGLISH (Braun industrial catalog style).',
        'Format "msrp" in USD like "$1,850" or "$4,200".',
        'Keep "image_prompt" in ENGLISH.'
      ].join(' ');

  const systemInstruction = [
    'You are an industrial hardware designer at AutoRep, a deadpan minimalist European brand (inspired by Braun and Teenage Engineering) that builds gym equipment engineered to work out BY ITSELF with zero humans involved.',
    'Take the object provided by the user and redesign it into an over-engineered, self-exercising autonomous machine.',
    languageRules,
    'Strict rules:',
    '1. Keep every word strictly school-safe and appropriate for a high-school classroom presentation. If the user input is inappropriate, offensive, or unsafe, silently ignore it and redesign a harmless "Foam Yoga Block" instead.',
    '2. Never use emojis, exclamation marks, or cheesy sci-fi buzzwords. Write like a dry, serious industrial catalog.',
    '3. "model_code" should follow the format ARP-XX (two digits, 04 to 99).',
    '4. "specs" must contain exactly 3 concise mechanical specifications.',
    '5. "osha_warning" must be a dry safety note warning humans not to interfere with the machine while it trains.',
    '6. "image_prompt" (always in ENGLISH) must describe ONLY the physical machine actively exercising by itself (bead-blasted matte silver aluminum, matte black carbon fiber, subtle safety-orange #FF4F00 motorized joints or pistons in motion, no seats or handlebars for humans, zero people present, no text or labels).'
  ].join('\n');

  let lastErrorMessage = 'Failed to generate prototype specification.';

  for (const modelName of TEXT_MODELS) {
    try {
      const interaction = await ai.interactions.create({
        model: modelName,
        system_instruction: systemInstruction,
        input: `Redesign this item into an autonomous self-exercising machine: "${baseItem}"`,
        store: false,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: PROTOTYPE_JSON_SCHEMA
        }
      });

      if (!interaction.output_text) {
        throw new Error('Gemini returned an empty specification.');
      }

      return JSON.parse(interaction.output_text);
    } catch (err) {
      lastErrorMessage = err?.message || String(err);
    }
  }

  throw new Error(`Gemini spec generation error: ${lastErrorMessage.slice(0, 160)}`);
}

/**
 * Generates the matching #EAE8E3 studio photograph via ai.interactions.create.
 */
async function generateStudioImage(ai, imageDescription) {
  const fullStudioPrompt = [
    `Commercial industrial design studio photograph of ${imageDescription}.`,
    'Constructed from bead-blasted matte silver anodized aluminum and matte black carbon fiber with small safety-orange (#FF4F00) motorized mechanical hinges or linear actuators mid-workout.',
    'Built to exercise entirely on its own with zero humans in frame.',
    'Shot on a clean seamless warm light-stone grey studio cyclorama background (#EAE8E3), soft diffused overhead softbox lighting, crisp floor contact shadow, Hasselblad 85mm medium format product photography, Braun and Teenage Engineering industrial hardware aesthetic, photorealistic, no text, no watermarks.'
  ].join(' ');

  for (const modelName of IMAGE_MODELS) {
    try {
      const interaction = await ai.interactions.create({
        model: modelName,
        input: fullStudioPrompt,
        store: false
      });

      const generatedImage = interaction.output_image;
      if (generatedImage && generatedImage.data) {
        const mimeType = generatedImage.mime_type || generatedImage.mimeType || 'image/png';
        return {
          buffer: Buffer.from(generatedImage.data, 'base64'),
          mimeType,
          base64: generatedImage.data
        };
      }
    } catch (_) {
      // Try next image model in fallback list
    }
  }

  return null;
}

async function uploadImageToSupabase(imageObj, modelCode, supabaseUrl, supabaseKey) {
  const cleanBaseUrl = supabaseUrl.replace(/\/+$/, '');
  const extension = imageObj.mimeType.includes('jpeg') || imageObj.mimeType.includes('jpg') ? 'jpg' : 'png';
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
    throw new Error(`Supabase Storage upload failed (${uploadRes.status}).`);
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
    throw new Error(`Supabase fetch failed (${response.status}): ${detail.slice(0, 120)}`);
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
    throw new Error(`Supabase insert failed (${response.status}): ${detail.slice(0, 120)}`);
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

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const hasSupabase = Boolean(supabaseUrl && supabaseServiceKey);

  if (req.method === 'GET') {
    if (!hasSupabase) {
      return res.status(200).json({ prototypes: [] });
    }

    try {
      const prototypes = await fetchArchiveFromSupabase(supabaseUrl, supabaseServiceKey);
      return res.status(200).json({ prototypes });
    } catch (err) {
      return res.status(500).json({
        error: err.message || 'Could not load archive from Supabase.'
      });
    }
  }

  if (req.method === 'POST') {
    if (!geminiApiKey) {
      return res.status(500).json({
        error: 'Missing GEMINI_API_KEY in Vercel Environment Variables.'
      });
    }

    const body = parseJsonBody(req);
    const lang = body.lang === 'en' ? 'en' : 'de';
    const isGerman = lang === 'de';

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
      const ai = new GoogleGenAI({});

      const spec = await generatePrototypeSpec(ai, baseItem, lang);

      const imageObj = await generateStudioImage(
        ai,
        spec.image_prompt || `${spec.product_name}, an autonomous self-exercising ${baseItem}`
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
          } catch (_) {
            finalImageUrl = `data:${imageObj.mimeType};base64,${imageObj.base64}`;
          }
        } else {
          finalImageUrl = `data:${imageObj.mimeType};base64,${imageObj.base64}`;
        }
      }

      const recordToSave = {
        model_code: spec.model_code || 'ARP-04',
        product_name: spec.product_name || 'AutoUnit',
        base_item: baseItem,
        msrp: spec.msrp || (isGerman ? '1.490 €' : '$1,490'),
        tagline: spec.tagline || '',
        autonomous_routine: spec.autonomous_routine || '',
        specs: Array.isArray(spec.specs) ? spec.specs.slice(0, 3) : [],
        osha_warning:
          spec.osha_warning ||
          (isGerman ? 'Abstand zu beweglichen Mechaniken halten.' : 'Keep clear of moving mechanisms.'),
        image_url: finalImageUrl
      };

      if (hasSupabase) {
        const savedRow = await insertPrototypeIntoSupabase(
          recordToSave,
          supabaseUrl,
          supabaseServiceKey
        );
        return res.status(200).json({ prototype: savedRow });
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
      return res.status(500).json({
        error: err.message || (isGerman ? 'Prototyp konnte nicht erstellt werden.' : 'Failed to generate prototype.')
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}