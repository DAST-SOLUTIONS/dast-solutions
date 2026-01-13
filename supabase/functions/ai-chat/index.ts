/**
 * Supabase Edge Function - AI Chat Assistant
 * Assistant IA pour questions sur les projets de construction
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
    const { messages, projectContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    // Construire le prompt système enrichi
    const systemPrompt = buildSystemPrompt(projectContext);
    
    let response;
    
    // Utiliser Claude si disponible, sinon OpenAI
    if (ANTHROPIC_API_KEY) {
      response = await callClaude(systemPrompt, messages);
    } else if (OPENAI_API_KEY) {
      response = await callOpenAI(systemPrompt, messages);
    } else {
      throw new Error('No API key configured');
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat Error:', error);
    return new Response(JSON.stringify({ 
      response: "Désolé, une erreur s'est produite. Veuillez réessayer.",
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildSystemPrompt(context?: any) {
  let prompt = `Tu es l'assistant IA de DAST Solutions, expert en gestion de projets de construction au Québec.

Tu connais parfaitement:
- Le Code National du Bâtiment (CNB 2020) et Code de construction du Québec
- Les conventions collectives CCQ (taux horaires, métiers, avantages sociaux)
- Les réglementations RBQ (Régie du bâtiment du Québec)
- Le système SEAO (appels d'offres publics)
- L'estimation et les takeoffs de construction
- La gestion de projets de construction commerciale, institutionnelle et résidentielle

Règles de communication:
- Réponds TOUJOURS en français québécois professionnel
- Sois concis et précis
- Utilise les unités métriques et la devise canadienne ($CAD)
- Cite les sources/réglementations quand pertinent
- Propose des suggestions d'actions quand approprié`;

  if (context) {
    prompt += `\n\nContexte du projet actuel:`;
    if (context.projectName) prompt += `\n- Projet: ${context.projectName}`;
    if (context.budget) prompt += `\n- Budget: ${(context.budget / 1000000).toFixed(2)}M$`;
    if (context.progress) prompt += `\n- Avancement: ${context.progress}%`;
    if (context.projectId) prompt += `\n- ID: ${context.projectId}`;
  }

  return prompt;
}

async function callClaude(systemPrompt: string, messages: any[]) {
  // Formater les messages pour Claude
  const formattedMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: formattedMessages
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text || '';

  return {
    response: content,
    model: 'claude-sonnet-4-20250514',
    suggestions: extractSuggestions(content)
  };
}

async function callOpenAI(systemPrompt: string, messages: any[]) {
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: formattedMessages,
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';

  return {
    response: content,
    model: 'gpt-4o',
    suggestions: extractSuggestions(content)
  };
}

function extractSuggestions(content: string): string[] {
  // Extraire les suggestions d'action du texte
  const suggestions: string[] = [];
  
  // Patterns pour détecter les suggestions
  const patterns = [
    /je (?:vous )?(?:recommande|suggère|conseille)[^.]+\./gi,
    /vous (?:pourriez|devriez)[^.]+\./gi,
    /il (?:serait|faudrait)[^.]+\./gi
  ];
  
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      suggestions.push(...matches.slice(0, 3)); // Max 3 par pattern
    }
  }
  
  return suggestions.slice(0, 5); // Max 5 suggestions
}
