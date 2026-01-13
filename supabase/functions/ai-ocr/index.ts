/**
 * Supabase Edge Function - OCR Documents
 * Utilise OpenAI GPT-4 Vision pour extraire les données des factures/devis
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image, type, language } = await req.json();

    if (!image) {
      throw new Error('Image is required');
    }

    // Prompt pour l'extraction OCR
    const prompt = `Tu es un expert en extraction de données de documents de construction au Québec.
Analyse cette image de ${type === 'facture' ? 'facture' : 'document'} et extrais les informations suivantes au format JSON:

{
  "document": {
    "type": "facture|devis|contrat|autre",
    "confidence": 0.95
  },
  "extractedData": {
    "fournisseur": "Nom du fournisseur",
    "numeroDocument": "Numéro de facture/devis",
    "date": "YYYY-MM-DD",
    "adresse": "Adresse complète",
    "montantHT": 0.00,
    "montantTPS": 0.00,
    "montantTVQ": 0.00,
    "montantTotal": 0.00,
    "lignes": [
      {
        "description": "Description de l'item",
        "quantite": 0,
        "unite": "unité",
        "prixUnitaire": 0.00,
        "total": 0.00,
        "confidence": 0.95
      }
    ]
  },
  "rawText": "Texte brut extrait du document"
}

Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.
Assure-toi que les montants sont en format numérique (pas de $ ou espaces).
Les taxes au Québec: TPS 5%, TVQ 9.975%.`;

    // Appel à OpenAI GPT-4 Vision
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
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '';

    // Parser le JSON de la réponse
    let parsedResult;
    try {
      // Nettoyer le contenu (enlever les backticks markdown si présents)
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      parsedResult = {
        document: { type: 'autre', confidence: 0.5 },
        extractedData: {},
        rawText: content
      };
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OCR Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
