import { GoogleGenAI } from "@google/genai";

const MODEL_ID = "gemini-4-hydrogen";

let cachedClient = null;
let cachedKey = "";

function getClient() {
  const key = String(process.env.GEMINI_API_KEY || "").trim().replace(/^['"]|['"]$/g, "");
  if (!key) return null;
  if (!cachedClient || cachedKey !== key) {
    process.env.GEMINI_API_KEY = key;
    cachedClient = new GoogleGenAI({ apiKey: key });
    cachedKey = key;
  }
  return cachedClient;
}

async function runHydrogen(ai, prompt) {
  try {
    const interaction = await ai.interactions.create({
      model: MODEL_ID,
      input: prompt,
      store: false,
      generation_config: {
        thinking_level: "low",
        temperature: 0.7,
      },
    });
    return interaction.output_text || "";
  } catch (err) {
    if (/thinking|store|generation_config/i.test(String(err?.message || ""))) {
      const fallback = await ai.interactions.create({
        model: MODEL_ID,
        input: prompt,
      });
      return fallback.output_text || "";
    }
    throw err;
  }
}

function buildSpecPrompt(item) {
  return `Role: Industrial designer at AutoRep (Braun / Teenage Engineering style). Every machine exercises by itself in empty rooms; zero humans permitted.
If "${item}" is unsafe/inappropriate, use "Yoga Block". No emojis, no exclamation marks.

Redesign "${item}" into an autonomous self-exercising machine. Return ONLY compact JSON:
{"model_code":"ARP-XX","de":{"product_name":"...","base_item":"...","msrp":"X.XXX €","tagline":"1 short sentence","autonomous_routine":"2 concise sentences","specs":["spec 1","spec 2","spec 3"],"osha_warning":"1 short sentence"},"en":{"product_name":"...","base_item":"...","msrp":"€X,XXX","tagline":"1 short sentence","autonomous_routine":"2 concise sentences","specs":["spec 1","spec 2","spec 3"],"osha_warning":"1 short sentence"}}`;
}

function buildCadPrompt({ model_code, product_name, base_item, autonomous_routine }) {
  return `Return ONLY raw valid <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 480">...</svg> (no markdown, max 45 lines, no <script>).
Draw an orthographic Braun-style CAD schematic of "${product_name}" (autonomous "${base_item}": ${autonomous_routine}):
- Background <rect width="880" height="480" fill="#EAE8E3"/> and border <rect x="24" y="24" width="832" height="432" fill="none" stroke="#CFCBC2"/>
- Label <text x="44" y="54" font-family="monospace" font-size="13" fill="#6E6D68">${model_code} // KINEMATIC CAD</text>
- Clean geometric silhouette centered in x:240..640, y:90..390 using stroke="#161615", fill="#DCD9D0" or "none", and "#FF4F00" on motorized joints/actuators.
- Add 1-2 smooth looping <animate> or <animateTransform> elements (repeatCount="indefinite", dur="1.8s" to "2.8s") showing the workout motion.`;
}

function sanitizeSvgToDataUrl(rawOutput) {
  const cleaned = String(rawOutput || "").replace(/```svg|```xml|```/gi, "").trim();
  const match = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) throw new Error("Invalid SVG output");

  let svg = match[0]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "");

  if (!/xmlns=/i.test(svg)) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const isGerman = body.lang !== "en";
  const ai = getClient();

  if (!ai) {
    return res.status(500).json({
      error: isGerman ? "GEMINI_API_KEY fehlt." : "Missing GEMINI_API_KEY.",
    });
  }

  // Step 2: Fast animated SVG CAD schematic
  if (body.action === "render_cad") {
    try {
      const rawSvg = await runHydrogen(
        ai,
        buildCadPrompt({
          model_code: body.model_code || "ARP-04",
          product_name: body.product_name || "AutoRep Unit",
          base_item: body.base_item || "Gym machine",
          autonomous_routine: body.autonomous_routine || "Performs motorized repetitions.",
        })
      );
      return res.status(200).json({ cad_svg: sanitizeSvgToDataUrl(rawSvg) });
    } catch (_) {
      return res.status(200).json({ cad_svg: null });
    }
  }

  // Step 1: Fast bilingual JSON datasheet
  const item = String(body.item || "").trim().slice(0, 80);
  if (!item) {
    return res.status(400).json({
      error: isGerman ? "Bitte einen Gegenstand eingeben." : "Please enter an item.",
    });
  }

  try {
    const rawText = (await runHydrogen(ai, buildSpecPrompt(item)))
      .replace(/```json|```/gi, "")
      .trim();

    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Invalid JSON from AI");

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

    return res.status(200).json({
      prototype: {
        id: `arp-${Date.now()}`,
        model_code: spec.model_code || `ARP-${Math.floor(10 + Math.random() * 89)}`,
        i18n: { de: deBlock, en: enBlock },
        cad_svg: null,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Generation failed" });
  }
}
