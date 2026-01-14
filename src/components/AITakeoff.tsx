/**
 * AITakeoff Component - AI-powered construction plan analysis
 */
import React, { useState } from 'react';
import { Brain, Upload, FileText, Layers } from 'lucide-react';
import { analyzePageWithAI, elementsToTakeoffItems, DEFAULT_LAYERS, CSC_CATEGORIES } from '@/services/aiTakeoffService';
import type { TakeoffItem, TakeoffLayer, AIAnalysisResult } from '@/services/aiTakeoffService';

interface AITakeoffProps {
  onItemsGenerated?: (items: TakeoffItem[]) => void;
}

export function AITakeoff({ onItemsGenerated }: AITakeoffProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [items, setItems] = useState<TakeoffItem[]>([]);
  const [layers] = useState<TakeoffLayer[]>(DEFAULT_LAYERS);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const analysisResult = await analyzePageWithAI(file);
      setResult(analysisResult);
      
      if (analysisResult.success) {
        const takeoffItems = elementsToTakeoffItems(analysisResult.elements);
        setItems(takeoffItems);
        onItemsGenerated?.(takeoffItems);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Analyse IA des plans</h2>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          className="hidden"
          id="plan-upload"
        />
        <label htmlFor="plan-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            {loading ? 'Analyse en cours...' : 'Glissez un plan ou cliquez pour téléverser'}
          </p>
        </label>
      </div>

      {result?.success && (
        <div className="mt-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Éléments détectés ({result.elements.length})
          </h3>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-gray-500">{item.category}</p>
                </div>
                <div className="text-right">
                  <p>{item.quantity} {item.unit}</p>
                  <p className="text-sm text-gray-500">{((item.confidence || 0) * 100).toFixed(0)}% confiance</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Calques
        </h3>
        <div className="flex flex-wrap gap-2">
          {layers.map(layer => (
            <span
              key={layer.id}
              className="px-3 py-1 rounded-full text-sm"
              style={{ backgroundColor: layer.color + '20', color: layer.color }}
            >
              {layer.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AITakeoff;
