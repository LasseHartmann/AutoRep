import { GoogleGenAI } from "@google/genai";

const MODEL_ID = "gemini-4-hydrogen";

const cleanEnv = (val) => String(val || "").trim().replace(/^['"]|['"]$/g, "");

function supabaseHeaders(secretKey, extra = {}) {
  const headers = { apikey: secretKey, ...extra };
  if (!secretKey.startsWith("sb_")) {
    headers.Authorization = `Bearer ${secretKey}`;
  }
  return headers;
}

async function runHydrogen(prompt) {
  const ai = new GoogleGenAI({});
  try {
    const interaction = await ai.interactions.create({
      model: MODEL_ID,
      input: prompt,
      generation_config: { thinking_level: "low" },
    });
    return interaction.output_text || "";
  } catch (_) {
    const fallback = await ai.interactions.create({
      model: MODEL_ID,
      input: prompt,
    });
    return fallback.output_text || "";
  }
}

function buildSpecPrompt(item) {
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

function buildCadPrompt({ model_code, product_name, base_item, autonomous_routine }) {
  return `Create an animated 2D orthographic industrial CAD schematic SVG of this autonomous self-exercising gym machine:
- Model Code: ${model_code}
- Machine Name: ${product_name}
- Base Equipment: ${base_item}
- Autonomous Motion: ${autonomous_routine}

Strict SVG rules:
1. Return ONLY raw valid <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 480">...</svg> with no markdown fences and no explanation.
2. Aesthetic: Dieter Rams Braun / Teenage Engineering technical blueprint.
   - Full background rect: fill="#EAE8E3"
   - Subtle technical border rect (x="24" y="24" width="832" height="432" fill="none" stroke="#CFCBC2" stroke-width="1") and light registration crosshairs/dimension ticks in "#C5C1B8".
   - Machine chassis & recognizable silhouette of "${base_item}" drawn cleanly in centered orthographic view (x: 220..660, y: 80..400) using stroke="#161615", fills in "#DCD9D0" or "none", and safety-orange "#FF4F00" only on key motorized actuators/pistons/joints.
   - Top-left label (x="44" y="54" font-family="monospace" font-size="13" fill="#6E6D68"): "${model_code} // KINEMATIC CAD"
3. Animation: Include 1 to 3 smooth looping SVG <animate> or <animateTransform> tags (repeatCount="indefinite", dur between "1.6s" and "3.2s") that physically animate the machine performing its autonomous workout repetitions.
4. Keep SVG concise (under 70 lines), crisp geometric vectors, zero <script> tags, zero external images/fonts.`;
}

function sanitizeSvgToDataUrl(rawOutput) {
  const cleaned = String(rawOutput || "").replace(/```svg|```xml|```/gi, "").trim();
  const match = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) {
    throw new Error("Gemini did not return a valid SVG schematic");
  }

  let svg = match[0]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "");

  if (!/xmlns=/i.test(svg)) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default async function handler(req, res) {
  const geminiKey = cleanEnv(process.env.GEMINI_API_KEY);
  if (geminiKey) process.env.GEMINI_API_KEY = geminiKey;

  const supabaseUrl = cleanEnv(process.env.SUPABASE_URL).replace(/\/+$/, "");
  const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (req.method === "GET") {
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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const action = body.action || "create";
  const isGerman = body.lang !== "en";

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: isGerman ? "GEMINI_API_KEY fehlt." : "Missing GEMINI_API_KEY.",
    });
  }

  // REQUEST 2: Generate custom animated SVG CAD schematic for the created machine
  if (action === "render_cad") {
    const proto = body.prototype || {};
    const id = body.id || proto.id;
    const enInfo = proto.specs?.i18n?.en || proto;

    try {
      const rawSvg = await runHydrogen(
        buildCadPrompt({
          model_code: proto.model_code || "ARP-04",
          product_name: enInfo.product_name || proto.product_name || "AutoRep Unit",
          base_item: enInfo.base_item || proto.base_item || "Gym machine",
          autonomous_routine: enInfo.autonomous_routine || proto.autonomous_routine || "Performs motorized repetitions.",
        })
      );

      const cadDataUrl = sanitizeSvgToDataUrl(rawSvg);
      const updatedSpecs = {
        ...(typeof proto.specs === "object" && !Array.isArray(proto.specs) ? proto.specs : { list: [] }),
        cad_svg: cadDataUrl,
      };

      if (supabaseUrl && supabaseKey && id && !String(id).startsWith("local-")) {
        await fetch(`${supabaseUrl}/rest/v1/prototypes?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: supabaseHeaders(supabaseKey, { "Content-Type": "application/json" }),
          body: JSON.stringify({ specs: updatedSpecs }),
        });
      }

      return res.status(200).json({ cad_svg: cadDataUrl });
    } catch (err) {
      return res.status(200).json({ cad_svg: null, warning: err?.message });
    }
  }

  // REQUEST 1: Generate bilingual technical datasheet
  const item = String(body.item || "").trim().slice(0, 80);
  if (!item) {
    return res.status(400).json({
      error: isGerman ? "Bitte einen Gegenstand eingeben." : "Please enter an item.",
    });
  }

  try {
    const rawText = (await runHydrogen(buildSpecPrompt(item)))
      .replace(/```json|```/gi, "")
      .trim();

    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("Invalid JSON returned from Gemini");
    }

    const spec = JSON.parse(rawText.slice(start, end + 1));
    const de = spec.de || spec.en || {};
    const en = spec.en || spec.de || {};

    const deBlock = {
      product_name: de.product_name || `AutoRep ${item}`,
      base_item: de.base_item || item,
      msrp: de.msrp || "3.490 €",
      tagline: de.tagline || "",
      autonomous_routine: de.autonomous_routine || "",
      specs: Array.isArray(de.specs) ? de.specs.slice(0, 3) : [],
      osha_warning: de.osha_warning || "Sicherheitsabstand einhalten.",
    };

    const enBlock = {
      product_name: en.product_name || deBlock.product_name,
      base_item: en.base_item || item,
      msrp: en.msrp || "€3,490",
      tagline: en.tagline || deBlock.tagline,
      autonomous_routine: en.autonomous_routine || deBlock.autonomous_routine,
      specs: Array.isArray(en.specs) ? en.specs.slice(0, 3) : deBlock.specs,
      osha_warning: en.osha_warning || "Maintain safe clearance.",
    };

    const recordToInsert = {
      model_code: spec.model_code || `ARP-${Math.floor(10 + Math.random() * 89)}`,
      product_name: deBlock.product_name,
      base_item: deBlock.base_item,
      msrp: deBlock.msrp,
      tagline: deBlock.tagline,
      autonomous_routine: deBlock.autonomous_routine,
      specs: { list: deBlock.specs, i18n: { de: deBlock, en: enBlock }, cad_svg: null },
      osha_warning: deBlock.osha_warning,
    };

    let savedRecord = { id: `local-${Date.now()}`, ...recordToInsert };

    if (supabaseUrl && supabaseKey) {
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/prototypes`, {
        method: "POST",
        headers: supabaseHeaders(supabaseKey, {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        }),
        body: JSON.stringify(recordToInsert),
      });

      if (insertRes.ok) {
        const insertedRows = await insertRes.json();
        if (insertedRows?.[0]) savedRecord = insertedRows[0];
      }
    }

    return res.status(200).json({ prototype: savedRecord });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Prototype synthesis failed" });
  }
}
