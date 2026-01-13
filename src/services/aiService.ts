/**
 * Service IA - Intégration OpenAI GPT-4 Vision et Claude
 */

import { supabase } from '../lib/supabase/client';

export interface OCRResult {
  success: boolean;
  document: {
    type: 'facture' | 'devis' | 'plan' | 'contrat' | 'autre';
    confidence: number;
  };
  extractedData: {
    fournisseur?: string;
    numeroDocument?: string;
    date?: string;
    montantHT?: number;
    montantTPS?: number;
    montantTVQ?: number;
    montantTotal?: number;
    lignes?: OCRLigne[];
  };
  rawText: string;
}

export interface OCRLigne {
  description: string;
  quantite?: number;
  unite?: string;
  prixUnitaire?: number;
  total?: number;
  confidence: number;
}

export interface TakeoffAIResult {
  success: boolean;
  elements: TakeoffElement[];
  scale?: {
    detected: boolean;
    value: string;
    confidence: number;
  };
  processingTime: number;
}

export interface TakeoffElement {
  id: string;
  type: 'surface' | 'lineaire' | 'comptage' | 'volume';
  nom: string;
  quantite: number;
  unite: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  sources?: string[];
  suggestions?: string[];
}

class AIService {
  /**
   * OCR d'un document (facture, devis)
   */
  async ocrDocument(file: File | string): Promise<OCRResult> {
    try {
      let base64Image: string;

      if (file instanceof File) {
        base64Image = await this.fileToBase64(file);
      } else {
        base64Image = file;
      }

      const { data, error } = await supabase.functions.invoke('ai-ocr', {
        body: {
          image: base64Image,
          type: 'document',
          language: 'fr'
        }
      });

      if (error) throw error;

      return {
        success: true,
        document: data.document,
        extractedData: data.extractedData,
        rawText: data.rawText
      };
    } catch (error) {
      console.error('Erreur OCR:', error);
      return {
        success: false,
        document: { type: 'autre', confidence: 0 },
        extractedData: {},
        rawText: ''
      };
    }
  }

  /**
   * Analyse d'un plan de construction
   */
  async analyzePlan(file: File | string, options?: {
    detectTypes?: ('surface' | 'lineaire' | 'comptage' | 'volume')[];
    minConfidence?: number;
    scale?: string;
  }): Promise<TakeoffAIResult> {
    try {
      let base64Image: string;

      if (file instanceof File) {
        base64Image = await this.fileToBase64(file);
      } else {
        base64Image = file;
      }

      const startTime = Date.now();

      const { data, error } = await supabase.functions.invoke('ai-takeoff', {
        body: {
          image: base64Image,
          options: {
            detectTypes: options?.detectTypes || ['surface', 'lineaire', 'comptage', 'volume'],
            minConfidence: options?.minConfidence || 0.85,
            scale: options?.scale,
            language: 'fr'
          }
        }
      });

      if (error) throw error;

      return {
        success: true,
        elements: data.elements || [],
        scale: data.scale,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Erreur analyse plan:', error);
      return {
        success: false,
        elements: [],
        processingTime: 0
      };
    }
  }

  /**
   * Chat avec l'assistant IA
   */
  async chat(messages: ChatMessage[], projectContext?: {
    projectId?: string;
    projectName?: string;
    budget?: number;
    progress?: number;
  }): Promise<ChatResponse> {
    try {
      const systemMessage = this.buildSystemPrompt(projectContext);

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            { role: 'system', content: systemMessage },
            ...messages
          ],
          projectContext
        }
      });

      if (error) throw error;

      return {
        message: data.response,
        sources: data.sources,
        suggestions: data.suggestions
      };
    } catch (error) {
      console.error('Erreur chat IA:', error);
      return {
        message: "Désolé, je rencontre une erreur technique. Veuillez réessayer.",
        suggestions: []
      };
    }
  }

  /**
   * Prédiction de dépassement budgétaire
   */
  async predictBudgetOverrun(projectData: {
    projectId: string;
    budgetInitial: number;
    depensesActuelles: number;
    avancement: number;
    historique: { date: string; depense: number }[];
  }): Promise<{
    predictedFinal: number;
    overrunAmount: number;
    overrunPercent: number;
    confidence: number;
    factors: { name: string; impact: number; trend: 'up' | 'down' | 'stable' }[];
    recommendations: string[];
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-prediction', {
        body: { projectData }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur prédiction:', error);
      const burnRate = projectData.depensesActuelles / (projectData.avancement / 100);
      const predictedFinal = burnRate;
      const overrunAmount = predictedFinal - projectData.budgetInitial;
      
      return {
        predictedFinal,
        overrunAmount,
        overrunPercent: (overrunAmount / projectData.budgetInitial) * 100,
        confidence: 0.6,
        factors: [],
        recommendations: ['Analyse détaillée requise']
      };
    }
  }

  /**
   * Comparer des soumissions
   */
  async compareBids(bids: {
    id: string;
    company: string;
    amount: number;
    details: Record<string, number>;
    timeline: number;
  }[]): Promise<{
    ranking: { bidId: string; score: number; strengths: string[]; weaknesses: string[] }[];
    recommended: string;
    analysis: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-compare-bids', {
        body: { bids }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur comparaison:', error);
      
      const sorted = [...bids].sort((a, b) => a.amount - b.amount);
      return {
        ranking: sorted.map((bid, index) => ({
          bidId: bid.id,
          score: 100 - (index * 15),
          strengths: index === 0 ? ['Prix le plus bas'] : [],
          weaknesses: index === sorted.length - 1 ? ['Prix le plus élevé'] : []
        })),
        recommended: sorted[0].id,
        analysis: 'Classement basé sur le prix uniquement (analyse IA non disponible)'
      };
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
  }

  private buildSystemPrompt(context?: {
    projectId?: string;
    projectName?: string;
    budget?: number;
    progress?: number;
  }): string {
    let prompt = `Tu es un assistant expert en gestion de projets de construction au Québec. 
Tu connais parfaitement:
- Les normes de construction québécoises (CNB 2020)
- Les conventions collectives CCQ
- Les réglementations RBQ
- Les processus d'appels d'offres SEAO
- L'estimation et les takeoffs

Réponds toujours en français de manière professionnelle et concise.`;

    if (context?.projectName) {
      prompt += `\n\nContexte du projet actuel:
- Projet: ${context.projectName}
- Budget: ${context.budget ? `${(context.budget / 1000000).toFixed(2)}M$` : 'Non défini'}
- Avancement: ${context.progress ? `${context.progress}%` : 'Non défini'}`;
    }

    return prompt;
  }
}

export const aiService = new AIService();
export default aiService;
