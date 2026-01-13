/**
 * Supabase Edge Function - AI Takeoff
 * Analyse les plans de construction pour extraction automatique des quantités
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image, options } = await req.json();
    const { detectTypes, minConfidence, scale, language } = options || {};

    if (!image) {
      throw new Error('Image is required');
    }

    // Prompt pour l'analyse de plan
    const prompt = `Tu es un expert en lecture de plans de construction québécois.
Analyse ce plan et identifie tous les éléments mesurables.

Types d'éléments à détecter: ${(detectTypes || ['surface', 'lineaire', 'comptage', 'volume']).join(', ')}
Échelle du plan: ${scale || 'À détecter automatiquement'}
Langue: ${language || 'fr'}

Pour chaque élément détecté, fournis:
- type: surface | lineaire | comptage | volume
- nom: description de l'élément (ex: "Dalle béton RDC", "Mur extérieur", "Fenêtres")
- quantite: valeur numérique
- unite: m², m, unités, m³
- confidence: niveau de confiance 0-1
- boundingBox: {x, y, width, height} en pourcentage de l'image si possible

Réponds au format JSON:
{
  "elements": [...],
  "scale": {
    "detected": true/false,
    "value": "1:100",
    "confidence": 0.95
  }
}

IMPORTANT: 
- Utilise les unités métriques (m, m², m³)
- Sois précis dans les mesures
- Identifie les éléments de maçonnerie, béton, structure, fenestration
- Ne retourne que des éléments avec confidence > ${minConfidence || 0.85}`;

    let result;

    // Essayer Claude d'abord, puis OpenAI comme fallback
    if (ANTHROPIC_API_KEY) {
      result = await callClaude(image, prompt);
    } else if (OPENAI_API_KEY) {
      result = await callOpenAI(image, prompt);
    } else {
      throw new Error('No API key configured');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Takeoff Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      elements: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callClaude(image: string, prompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: image
              }
            },
            { type: 'text', text: prompt }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text || '';
  
  return parseResponse(content);
}

async function callOpenAI(image: string, prompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  
  return parseResponse(content);
}

function parseResponse(content: string) {
  try {
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanContent);
    
    return {
      success: true,
      elements: parsed.elements || [],
      scale: parsed.scale || { detected: false }
    };
  } catch (error) {
    console.error('Parse error:', error);
    return {
      success: false,
      elements: [],
      scale: { detected: false }
    };
  }
}
