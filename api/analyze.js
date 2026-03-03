import Anthropic from "@anthropic-ai/sdk";

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64, mode, elements } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const client = new Anthropic({ apiKey });

  const systemPrompt = `Tu es un expert en estimation construction au Québec.
Tu analyses des plans de construction pour extraire les quantités.
Réponds UNIQUEMENT en JSON valide (tableau), sans markdown, sans texte avant ou après.
Chaque objet doit avoir: element, type (surface|lineaire|comptage|volume), quantite (number), unite, confiance (0-100), zone, categorie.`;

  const userPrompt = mode === "guided" && elements?.length > 0
    ? \`Analyse ce plan et trouve UNIQUEMENT ces éléments: \${elements.join(", ")}.
Retourne un tableau JSON avec les quantités trouvées.\`
    : \`Analyse ce plan de construction. Identifie tous les éléments quantifiables:
surfaces (dalles, murs, toitures), linéaires (fondations, poutres, gouttières),
comptages (portes, fenêtres, colonnes), volumes (béton, remblai).
Retourne un tableau JSON.\`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
          { type: "text", text: userPrompt }
        ]
      }]
    });

    const text = message.content[0]?.text || "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    const results = JSON.parse(clean);
    return res.status(200).json({ results });
  } catch (err) {
    console.error("Anthropic error:", err);
    return res.status(500).json({ error: err.message });
  }
}
