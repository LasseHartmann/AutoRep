import { GoogleGenAI } from '@google/genai';

const TEXT_MODEL = 'gemini-4-hydrogen';
const FALLBACK_TEXT_MODEL = 'gemini-3.8-flash';
const LEGACY_TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'black-forest-labs/flux.1-schnell';
const STORAGE_BUCKET = 'prototypes';

const recentIpTimestamps = new Map();
const IP_COOLDOWN_MS = 4000;

function cleanEnv(val) {
  return String(val || '').trim().replace(/^['"]|['"]$/g, '');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown-ip';
}

function supabaseHeaders(secretKey, extra = {}) {
  const headers = {
    apikey: secretKey,
    'User-Agent': 'AutoRep-Server/1.0',
    ...extra
  };
  // Supabase sb_secret_ keys must ONLY be sent via `apikey`.
  // Legacy JWT service_role keys (eyJ...) also expect `Authorization: Bearer`.
  if (!String(secretKey).startsWith('sb_')) {
    headers.Authorization = `Bearer ${secretKey}`;
  }
  return headers;
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildCadSvgDataUrl(modelCode, title, motionType = 'piston') {
  const safeCode = escapeXml(modelCode || 'ARP-04');
  const safeTitle = escapeXml(String(title || 'AUTOREP PROTOTYPE').toUpperCase().slice(0, 32));
  let mech = '';

  if (motionType === 'spin' || motionType === 'rotary') {
    mech = `
      <circle cx="400" cy="218" r="92" fill="none" stroke="#161615" stroke-width="2.5"/>
      <circle cx="400" cy="218" r="14" fill="#FF4F00"/>
      <g>
        <line x1="400" y1="126" x2="400" y2="310" stroke="#161615" stroke-width="2.5"/>
        <line x1="308" y1="218" x2="492" y2="218" stroke="#161615" stroke-width="2.5"/>
        <circle cx="492" cy="218" r="7" fill="#FF4F00"/>
        <animateTransform attributeName="transform" type="rotate" from="0 400 218" to="360 400 218" dur="2.6s" repeatCount="indefinite"/>
      </g>`;
  } else if (motionType === 'hinge' || motionType === 'hinged') {
    mech = `
      <line x1="250" y1="290" x2="550" y2="290" stroke="#161615" stroke-width="3"/>
      <circle cx="330" cy="290" r="8" fill="#FF4F00"/>
      <line x1="330" y1="290" x2="490" y2="220" stroke="#161615" stroke-width="5">
        <animate attributeName="y2" values="284;195;284" dur="2.2s" repeatCount="indefinite"/>
      </line>`;
  } else if (motionType === 'cable') {
    mech = `
      <rect x="250" y="160" width="44" height="120" fill="none" stroke="#161615" stroke-width="2.5"/>
      <circle cx="272" cy="195" r="9" fill="#FF4F00"/>
      <path d="M 294 195 Q 390 135 470 215 T 575 215" fill="none" stroke="#161615" stroke-width="3.5">
        <animate attributeName="d" values="M 294 195 Q 390 135 470 215 T 575 215;M 294 195 Q 390 265 470 185 T 575 215;M 294 195 Q 390 135 470 215 T 575 215" dur="1.8s" repeatCount="indefinite"/>
      </path>`;
  } else if (motionType === 'roll' || motionType === 'roller') {
    mech = `
      <line x1="220" y1="286" x2="580" y2="286" stroke="#161615" stroke-width="2.5"/>
      <g>
        <circle cx="340" cy="246" r="40" fill="none" stroke="#161615" stroke-width="3"/>
        <circle cx="340" cy="246" r="9" fill="#FF4F00"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;120 0;0 0" dur="3.0s" repeatCount="indefinite"/>
      </g>`;
  } else {
    mech = `
      <rect x="332" y="110" width="14" height="216" fill="none" stroke="#161615" stroke-width="2"/>
      <rect x="454" y="110" width="14" height="216" fill="none" stroke="#161615" stroke-width="2"/>
      <g>
        <line x1="280" y1="180" x2="520" y2="180" stroke="#161615" stroke-width="4"/>
        <rect x="292" y="156" width="18" height="48" fill="#FF4F00"/>
        <rect x="490" y="156" width="18" height="48" fill="#FF4F00"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 76;0 0" dur="2.4s" repeatCount="indefinite"/>
      </g>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 436">
    <rect width="800" height="436" fill="#EAE8E3"/>
    <rect x="28" y="28" width="744" height="380" fill="none" stroke="#CFCBC2" stroke-width="1"/>
    <line x1="400" y1="76" x2="400" y2="360" stroke="#DCD8CF" stroke-width="1" stroke-dasharray="4 6"/>
    <text x="48" y="58" font-family="IBM Plex Mono, monospace" font-size="13" fill="#6E6D68">CAD SCHEMATIC // ${safeCode}</text>
    <text x="752" y="58" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="12" fill="#6E6D68">HUMANS PERMITTED: 00</text>
    <text x="48" y="388" font-family="Space Grotesk, sans-serif" font-size="15" font-weight="600" fill="#161615">${safeTitle}</text>
    ${mech}
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

async function generateSpecWithGemini(ai, item) {
  const prompt = `You are the lead industrial designer at AutoRep, a deadpan German-Swiss hardware brand (inspired by Braun and Teenage Engineering) that manufactures motorized gym equipment that works out completely by itself in empty rooms with zero humans.

School-safety rule: If the input is inappropriate or unsafe, silently redesign a harmless "Yoga Block" instead. Zero emojis, zero exclamation marks.

Convert this everyday fitness item or idea into an autonomous self-exercising AutoRep machine: "${item}"

Return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "model_code": "ARP-two-digit-number",
  "motion_type": "one of: spin | hinge | piston | cable | roll",
  "image_prompt": "Commercial industrial design studio photograph of [describe the physical autonomous gym machine mid-workout clearly, max 40 words], bead-blasted matte anodized aluminum, matte black carbon fiber, subtle #FF4F00 safety-orange motorized actuator accent, centered on a clean warm stone #EAE8E3 seamless studio cyclorama backdrop, soft diffused overhead lighting, Dieter Rams Braun and Teenage Engineering aesthetic, sharp focus, zero people, no text",
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

  const candidateModels = [TEXT_MODEL, FALLBACK_TEXT_MODEL, LEGACY_TEXT_MODEL];
  let rawText = '';
  let lastErr = null;

  for (const modelName of candidateModels) {
    const t0 = Date.now();
    try {
      const interaction = await ai.interactions.create({
        model: modelName,
        input: prompt,
        store: false,
        generation_config: {
          thinking_level: 'low'
        }
      });
      rawText = interaction?.output_text || '';
      if (rawText) {
        console.log(`[AutoRep] ${modelName} generated spec in ${Date.now() - t0}ms`);
        break;
      }
    } catch (err) {
      lastErr = err;
      console.warn(`[AutoRep] ${modelName} failed in ${Date.now() - t0}ms:`, err?.message || err);
    }
  }

  if (!rawText) {
    throw new Error(lastErr?.message || 'Gemini did not return a response');
  }

  const cleaned = rawText.replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Invalid JSON returned by Gemini');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function ensureStorageBucket(supabaseUrl, supabaseKey) {
  await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: supabaseHeaders(supabaseKey, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id: STORAGE_BUCKET, name: STORAGE_BUCKET, public: true })
  }).catch(() => {});
}

async function fetchFluxStudioImage(imagePrompt, pollinationsKey) {
  const seed = Math.floor(10000 + Math.random() * 899999);
  const imgUrl =
    `https://gen.pollinations.ai/image/${encodeURIComponent(imagePrompt)}` +
    `?model=${encodeURIComponent(IMAGE_MODEL)}&width=1280&height=704&seed=${seed}&nologo=true`;

  const headers = {
    Accept: 'image/*',
    'User-Agent': 'AutoRep-Studio/1.0'
  };
  if (pollinationsKey) {
    headers.Authorization = `Bearer ${pollinationsKey}`;
  }

  const t0 = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const imgRes = await fetch(imgUrl, { headers, signal: controller.signal });
    const contentType = imgRes.headers.get('content-type') || '';

    if (!imgRes.ok || !contentType.startsWith('image/')) {
      const errText = await imgRes.text().catch(() => '');
      console.warn(
        `[AutoRep] ${IMAGE_MODEL} returned ${imgRes.status} (${Date.now() - t0}ms):`,
        errText.slice(0, 140)
      );
      return null;
    }

    const arrayBuf = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    if (buffer.length < 4000) {
      return null;
    }

    console.log(`[AutoRep] ${IMAGE_MODEL} rendered photo in ${Date.now() - t0}ms (${buffer.length} bytes)`);
    return {
      buffer,
      contentType: contentType.split(';')[0] || 'image/jpeg'
    };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const geminiKey = cleanEnv(process.env.GEMINI_API_KEY);
  const supabaseUrl = cleanEnv(process.env.SUPABASE_URL).replace(/\/+$/, '');
  const supabaseKey = cleanEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  );
  const pollinationsKey = cleanEnv(process.env.POLLINATIONS_API_KEY);

  // GET: Load shared class archive from Supabase
  if (req.method === 'GET') {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ prototypes: [] });
    }
    try {
      const dbRes = await fetch(
        `${supabaseUrl}/rest/v1/prototypes?select=*&order=created_at.desc&limit=36`,
        { headers: supabaseHeaders(supabaseKey, { Accept: 'application/json' }) }
      );
      if (!dbRes.ok) {
        return res.status(200).json({ prototypes: [] });
      }
      const rows = await dbRes.json();
      return res.status(200).json({ prototypes: Array.isArray(rows) ? rows : [] });
    } catch (_) {
      return res.status(200).json({ prototypes: [] });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = {};
  if (typeof req.body === 'string') {
    try {
      body = JSON.parse(req.body || '{}');
    } catch (_) {
      body = {};
    }
  } else if (req.body && typeof req.body === 'object') {
    body = req.body;
  }

  const action = body.action || 'create';

  // STEP 2: Background studio photo upgrade via black-forest-labs/flux.1-schnell
  if (action === 'render_photo') {
    const { id, model_code, image_prompt } = body;
    if (!image_prompt) {
      return res.status(200).json({ upgraded: false });
    }

    try {
      const rendered = await fetchFluxStudioImage(String(image_prompt).slice(0, 600), pollinationsKey);
      if (!rendered) {
        return res.status(200).json({ upgraded: false });
      }

      let finalImageUrl = `data:${rendered.contentType};base64,${rendered.buffer.toString('base64')}`;

      if (supabaseUrl && supabaseKey) {
        await ensureStorageBucket(supabaseUrl, supabaseKey);
        const ext = rendered.contentType.includes('png') ? 'png' : 'jpg';
        const safeCode = String(model_code || 'arp')
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '');
        const fileName = `${Date.now()}-${safeCode}.${ext}`;

        const uploadRes = await fetch(
          `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${fileName}`,
          {
            method: 'POST',
            headers: supabaseHeaders(supabaseKey, {
              'Content-Type': rendered.contentType,
              'x-upsert': 'true'
            }),
            body: rendered.buffer
          }
        );

        if (uploadRes.ok) {
          finalImageUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${fileName}`;
        }

        if (id && !String(id).startsWith('local-') && !String(id).startsWith('preview-')) {
          await fetch(`${supabaseUrl}/rest/v1/prototypes?id=eq.${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: supabaseHeaders(supabaseKey, {
              'Content-Type': 'application/json',
              Prefer: 'return=minimal'
            }),
            body: JSON.stringify({ image_url: finalImageUrl })
          });
        }
      }

      return res.status(200).json({ upgraded: true, image_url: finalImageUrl });
    } catch (err) {
      console.warn('[AutoRep] render_photo skipped:', err?.message || err);
      return res.status(200).json({ upgraded: false });
    }
  }

  // STEP 1: Fast bilingual spec + animated CAD schematic (~2-4s)
  const item = String(body.item || '').trim().slice(0, 80);
  const isGerman = body.lang !== 'en';

  if (!item) {
    return res.status(400).json({
      error: isGerman ? 'Bitte einen Gegenstand eingeben.' : 'Missing item input.'
    });
  }

  if (!geminiKey) {
    return res.status(500).json({
      error: isGerman
        ? 'GEMINI_API_KEY fehlt in .env oder Vercel.'
        : 'Missing GEMINI_API_KEY in environment variables.'
    });
  }

  const clientIp = getClientIp(req);
  const now = Date.now();
  const lastAt = recentIpTimestamps.get(clientIp) || 0;
  if (now - lastAt < IP_COOLDOWN_MS) {
    const waitSec = Math.ceil((IP_COOLDOWN_MS - (now - lastAt)) / 1000);
    return res.status(429).json({
      error: isGerman ? `Bitte ${waitSec}s warten.` : `Please wait ${waitSec}s.`
    });
  }
  recentIpTimestamps.set(clientIp, now);
  if (recentIpTimestamps.size > 500) {
    recentIpTimestamps.clear();
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const spec = await generateSpecWithGemini(ai, item);

    const modelCode = spec.model_code || `ARP-${Math.floor(10 + Math.random() * 89)}`;
    const motionType = ['spin', 'hinge', 'piston', 'cable', 'roll'].includes(spec.motion_type)
      ? spec.motion_type
      : 'piston';

    const rawDe = spec.de || spec.en || {};
    const rawEn = spec.en || spec.de || {};

    const deBlock = {
      product_name: rawDe.product_name || rawEn.product_name || `AutoRep ${item}`,
      base_item: rawDe.base_item || item,
      msrp: rawDe.msrp || rawDe.price || '3.490 €',
      tagline: rawDe.tagline || '',
      autonomous_routine: rawDe.autonomous_routine || rawDe.autonomous_behavior || '',
      specs: Array.isArray(rawDe.specs) ? rawDe.specs.slice(0, 3) : [],
      osha_warning: rawDe.osha_warning || rawDe.safety_notice || 'Sicherheitsabstand einhalten.'
    };

    const enBlock = {
      product_name: rawEn.product_name || deBlock.product_name,
      base_item: rawEn.base_item || item,
      msrp: rawEn.msrp || rawEn.price || '€3,490',
      tagline: rawEn.tagline || deBlock.tagline,
      autonomous_routine: rawEn.autonomous_routine || rawEn.autonomous_behavior || deBlock.autonomous_routine,
      specs: Array.isArray(rawEn.specs) ? rawEn.specs.slice(0, 3) : deBlock.specs,
      osha_warning: rawEn.osha_warning || rawEn.safety_notice || 'Maintain safe clearance.'
    };

    const activeBlock = isGerman ? deBlock : enBlock;
    const cadSvgUrl = buildCadSvgDataUrl(modelCode, activeBlock.product_name, motionType);
    const imagePrompt =
      spec.image_prompt ||
      `Commercial studio photograph of ${enBlock.product_name}, an autonomous self-exercising ${enBlock.base_item} made of anodized aluminum and matte carbon fiber with #FF4F00 orange actuators on a #EAE8E3 backdrop, zero humans`;

    const specsPayload = {
      list: deBlock.specs,
      motion_type: motionType,
      cad_svg: cadSvgUrl,
      image_prompt: imagePrompt,
      i18n: {
        de: deBlock,
        en: enBlock
      }
    };

    // Matches the exact columns of public.prototypes in Supabase
    const recordToInsert = {
      model_code: modelCode,
      product_name: deBlock.product_name,
      base_item: deBlock.base_item,
      msrp: deBlock.msrp,
      tagline: deBlock.tagline,
      autonomous_routine: deBlock.autonomous_routine,
      specs: specsPayload,
      osha_warning: deBlock.osha_warning,
      image_url: cadSvgUrl
    };

    let savedRecord = {
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...recordToInsert
    };

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
        if (Array.isArray(insertedRows) && insertedRows[0]) {
          savedRecord = insertedRows[0];
        }
      } else {
        const dbErrText = await insertRes.text().catch(() => '');
        console.warn(`[AutoRep] Supabase insert warning (${insertRes.status}):`, dbErrText.slice(0, 160));
      }
    }

    return res.status(200).json({
      prototype: savedRecord,
      image_prompt: imagePrompt
    });
  } catch (err) {
    console.error('[AutoRep] Synthesis failed:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Prototype synthesis failed'
    });
  }
}
