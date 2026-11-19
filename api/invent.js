import { GoogleGenAI } from '@google/genai';

const TEXT_MODEL = 'gemini-4-hydrogen';
const FALLBACK_TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'black-forest-labs/flux.1-schnell';

function cleanEnv(val) {
  return String(val || '').trim().replace(/^['"]|['"]$/g, '');
}

function supabaseHeaders(secretKey, extra = {}) {
  const headers = {
    apikey: secretKey,
    ...extra
  };
  if (secretKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${secretKey}`;
  }
  return headers;
}

function buildCadSvgDataUrl(modelCode, title, motionType = 'piston') {
  const safeCode = String(modelCode || 'AR-X01').replace(/[<>&"']/g, '');
  const safeTitle = String(title || 'AUTOREP PROTOTYPE').slice(0, 32).replace(/[<>&"']/g, '');
  let mech = '';

  if (motionType === 'spin') {
    mech = `
      <circle cx="400" cy="218" r="92" fill="none" stroke="#161615" stroke-width="2"/>
      <circle cx="400" cy="218" r="14" fill="#FF4F00"/>
      <g>
        <line x1="400" y1="126" x2="400" y2="310" stroke="#161615" stroke-width="2"/>
        <line x1="308" y1="218" x2="492" y2="218" stroke="#161615" stroke-width="2"/>
        <circle cx="492" cy="218" r="7" fill="#FF4F00"/>
        <animateTransform attributeName="transform" type="rotate" from="0 400 218" to="360 400 218" dur="3s" repeatCount="indefinite"/>
      </g>`;
  } else if (motionType === 'hinge') {
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
  } else if (motionType === 'roll') {
    mech = `
      <line x1="220" y1="286" x2="580" y2="286" stroke="#161615" stroke-width="2"/>
      <g>
        <circle cx="340" cy="246" r="40" fill="none" stroke="#161615" stroke-width="3"/>
        <circle cx="340" cy="246" r="9" fill="#FF4F00"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;120 0;0 0" dur="3.2s" repeatCount="indefinite"/>
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
    <text x="48" y="58" font-family="IBM Plex Mono, monospace" font-size="13" fill="#6E6D68">CAD SCHEMATIC // ${safeCode}</text>
    <text x="48" y="388" font-family="Space Grotesk, sans-serif" font-size="15" font-weight="600" fill="#161615">${safeTitle}</text>
    ${mech}
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

async function generateSpecWithGemini(ai, item) {
  const prompt = `You are the lead industrial designer at AutoRep, a deadpan German-Swiss hardware brand (inspired by Braun and Teenage Engineering) that manufactures motorized gym equipment that works out completely by itself in empty rooms with zero humans.

Convert this everyday fitness item or idea into an autonomous self-exercising AutoRep machine: "${item}"

Return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "model_code": "AR-3-digit-number",
  "motion_type": "one of: spin | hinge | piston | cable | roll",
  "image_prompt": "Minimalist studio industrial product photograph of [describe the physical autonomous gym machine clearly], machined matte anodized aluminum, matte carbon fiber, subtle #FF4F00 safety-orange mechanical actuator accent, centered on a clean warm stone #EAE8E3 seamless studio backdrop, soft diffused overhead studio lighting, Dieter Rams Braun and Teenage Engineering industrial design aesthetic, sharp focus, zero people, no text or watermarks",
  "de": {
    "product_name": "Prägnanter Produktname",
    "tagline": "Ein trockener, seriöser Katalogsatz auf Deutsch.",
    "autonomous_behavior": "2 präzise Sätze auf Deutsch, wie das Gerät im leeren Raum komplett alleine trainiert.",
    "price": "z. B. 3.490 €",
    "specs": ["Technische Spezifikation 1", "Technische Spezifikation 2", "Technische Spezifikation 3"],
    "safety_notice": "Trockener Sicherheitshinweis auf Deutsch."
  },
  "en": {
    "product_name": "Concise product name",
    "tagline": "One deadpan industrial catalog sentence in English.",
    "autonomous_behavior": "2 precise sentences in English describing how the machine exercises completely by itself in an empty room.",
    "price": "e.g. €3,490",
    "specs": ["Technical spec 1", "Technical spec 2", "Technical spec 3"],
    "safety_notice": "Deadpan safety warning in English."
  }
}`;

  let rawText = '';
  try {
    const interaction = await ai.interactions.create({
      model: TEXT_MODEL,
      input: prompt
    });
    rawText = interaction.output_text || '';
  } catch (_) {
    const fallbackInteraction = await ai.interactions.create({
      model: FALLBACK_TEXT_MODEL,
      input: prompt
    });
    rawText = fallbackInteraction.output_text || '';
  }

  const cleaned = rawText.replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Invalid JSON from Gemini');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function ensureStorageBucket(supabaseUrl, supabaseKey) {
  await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: supabaseHeaders(supabaseKey, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id: 'prototypes', name: 'prototypes', public: true })
  }).catch(() => {});
}

export default async function handler(req, res) {
  const geminiKey = cleanEnv(process.env.GEMINI_API_KEY);
  const supabaseUrl = cleanEnv(process.env.SUPABASE_URL).replace(/\/+$/, '');
  const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const pollinationsKey = cleanEnv(process.env.POLLINATIONS_API_KEY);

  if (req.method === 'GET') {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ prototypes: [] });
    }
    try {
      const dbRes = await fetch(
        `${supabaseUrl}/rest/v1/prototypes?select=*&order=created_at.desc&limit=36`,
        { headers: supabaseHeaders(supabaseKey) }
      );
      if (!dbRes.ok) return res.status(200).json({ prototypes: [] });
      const rows = await dbRes.json();
      return res.status(200).json({ prototypes: Array.isArray(rows) ? rows : [] });
    } catch (_) {
      return res.status(200).json({ prototypes: [] });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const action = body.action || 'create';

  // STEP 2: Background studio photo upgrade using black-forest-labs/flux.1-schnell
  if (action === 'render_photo') {
    const { id, model_code, image_prompt } = body;
    if (!image_prompt) {
      return res.status(200).json({ upgraded: false });
    }

    try {
      const seed = Math.floor(10000 + Math.random() * 899999);
      const imgUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(image_prompt)}?model=${encodeURIComponent(IMAGE_MODEL)}&width=1280&height=700&seed=${seed}&nologo=true`;

      const fetchHeaders = {};
      if (pollinationsKey) {
        fetchHeaders.Authorization = `Bearer ${pollinationsKey}`;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const imgRes = await fetch(imgUrl, { headers: fetchHeaders, signal: controller.signal });
      clearTimeout(timeout);

      if (!imgRes.ok) {
        return res.status(200).json({ upgraded: false });
      }

      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const arrayBuf = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (buffer.length < 1500) {
        return res.status(200).json({ upgraded: false });
      }

      let finalImageUrl = `data:${contentType};base64,${buffer.toString('base64')}`;

      if (supabaseUrl && supabaseKey) {
        await ensureStorageBucket(supabaseUrl, supabaseKey);
        const ext = contentType.includes('png') ? 'png' : 'jpg';
        const fileName = `${String(model_code || 'ar').toLowerCase()}-${Date.now()}.${ext}`;

        const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/prototypes/${fileName}`, {
          method: 'POST',
          headers: supabaseHeaders(supabaseKey, {
            'Content-Type': contentType,
            'x-upsert': 'true'
          }),
          body: buffer
        });

        if (uploadRes.ok) {
          finalImageUrl = `${supabaseUrl}/storage/v1/object/public/prototypes/${fileName}`;
        }

        if (id && !String(id).startsWith('local-')) {
          await fetch(`${supabaseUrl}/rest/v1/prototypes?id=eq.${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: supabaseHeaders(supabaseKey, { 'Content-Type': 'application/json' }),
            body: JSON.stringify({ image_url: finalImageUrl })
          });
        }
      }

      return res.status(200).json({ upgraded: true, image_url: finalImageUrl });
    } catch (_) {
      return res.status(200).json({ upgraded: false });
    }
  }

  // STEP 1: Fast bilingual spec + animated CAD schematic (~2-3s)
  const item = String(body.item || '').trim().slice(0, 80);
  const lang = body.lang === 'en' ? 'en' : 'de';

  if (!item) {
    return res.status(400).json({ error: 'Missing item input' });
  }
  if (!geminiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY in environment variables' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const spec = await generateSpecWithGemini(ai, item);

    const modelCode = spec.model_code || `AR-${Math.floor(100 + Math.random() * 900)}`;
    const motionType = ['spin', 'hinge', 'piston', 'cable', 'roll'].includes(spec.motion_type)
      ? spec.motion_type
      : 'piston';
    const deBlock = spec.de || spec.en;
    const enBlock = spec.en || spec.de;
    const activeBlock = lang === 'en' ? enBlock : deBlock;

    const cadSvgUrl = buildCadSvgDataUrl(modelCode, activeBlock.product_name, motionType);
    const specsPayload = {
      list: Array.isArray(deBlock.specs) ? deBlock.specs : [],
      motion_type: motionType,
      image_prompt: spec.image_prompt || '',
      i18n: {
        de: deBlock,
        en: enBlock
      }
    };

    const recordToInsert = {
      model_code: modelCode,
      product_name: deBlock.product_name,
      tagline: deBlock.tagline,
      autonomous_behavior: deBlock.autonomous_behavior,
      price: deBlock.price,
      specs: specsPayload,
      safety_notice: deBlock.safety_notice,
      image_url: cadSvgUrl
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
        if (Array.isArray(insertedRows) && insertedRows[0]) {
          savedRecord = insertedRows[0];
        }
      }
    }

    return res.status(200).json({
      prototype: savedRecord,
      image_prompt: spec.image_prompt || ''
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Prototype synthesis failed'
    });
  }
}
