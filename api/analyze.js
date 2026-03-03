// Vercel Serverless Function - ES Module syntax (matches project "type": "module")
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mode, elements } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const systemPrompt = `Tu es un expert en estimation construction au Quebec.
Tu analyses des plans de construction pour extraire les quantites.
Reponds UNIQUEMENT en JSON valide (tableau), sans markdown, sans texte avant ou apres.
Chaque objet doit avoir: element, type (surface|lineaire|comptage|volume), quantite (number), unite, confiance (0-100), zone, categorie.`;

  const userPrompt = mode === 'guided' && elements && elements.length > 0
    ? `Analyse ce plan et trouve UNIQUEMENT ces elements: ${elements.join(', ')}. Retourne un tableau JSON.`
    : `Analyse ce plan de construction. Identifie tous les elements quantifiables: surfaces (dalles, murs, toitures), lineaires (fondations, poutres, gouttieres), comptages (portes, fenetres, colonnes), volumes (beton, remblai). Retourne un tableau JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: userPrompt }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic error:', response.status, errText);
      return res.status(500).json({ error: `Anthropic ${response.status}: ${errText.slice(0, 200)}` });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();

    let results = [];
    try { results = JSON.parse(clean); }
    catch (e) { return res.status(500).json({ error: 'JSON parse error: ' + clean.slice(0, 100) }); }

    return res.status(200).json({ results });
  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
