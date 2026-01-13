import React, { useState, useCallback } from 'react';
import { 
  Brain, Upload, FileText, Zap, CheckCircle, Clock, AlertTriangle,
  Eye, Download, Settings, Play, Pause, RefreshCw, Layers, 
  Ruler, Square, Circle, Triangle, Grid, ChevronRight,
  Sparkles, Target, Box, BarChart3, X, Image, File
} from 'lucide-react';

interface AnalysisResult {
  id: string;
  type: 'surface' | 'lineaire' | 'comptage' | 'volume';
  element: string;
  quantite: number;
  unite: string;
  confiance: number;
  page: number;
  zone?: string;
}

interface UploadedPlan {
  id: string;
  name: string;
  type: string;
  size: number;
  pages: number;
  status: 'uploading' | 'processing' | 'analyzed' | 'error';
  progress: number;
  results?: AnalysisResult[];
}

const AITakeoffModule: React.FC = () => {
  const [plans, setPlans] = useState<UploadedPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'auto' | 'guided'>('auto');
  const [showSettings, setShowSettings] = useState(false);

  const [demoResults] = useState<AnalysisResult[]>([
    { id: '1', type: 'surface', element: 'Dalle béton niveau 1', quantite: 1250, unite: 'm²', confiance: 96, page: 1, zone: 'A1-A4' },
    { id: '2', type: 'surface', element: 'Mur extérieur brique', quantite: 845, unite: 'm²', confiance: 94, page: 2, zone: 'Façade Nord' },
    { id: '3', type: 'lineaire', element: 'Fondation périmétrique', quantite: 186, unite: 'm', confiance: 98, page: 1, zone: 'Périmètre' },
    { id: '4', type: 'comptage', element: 'Fenêtres type A (1.2x1.5m)', quantite: 24, unite: 'unités', confiance: 99, page: 3, zone: 'Tous niveaux' },
    { id: '5', type: 'comptage', element: 'Portes intérieures', quantite: 42, unite: 'unités', confiance: 97, page: 4, zone: 'Niveaux 1-3' },
    { id: '6', type: 'surface', element: 'Toiture membrane', quantite: 1320, unite: 'm²', confiance: 95, page: 5, zone: 'Toiture' },
    { id: '7', type: 'volume', element: 'Béton fondations', quantite: 185, unite: 'm³', confiance: 92, page: 1, zone: 'Fondations' },
    { id: '8', type: 'lineaire', element: 'Gouttières aluminium', quantite: 124, unite: 'm', confiance: 91, page: 5, zone: 'Périmètre toiture' },
  ]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const newPlans: UploadedPlan[] = files.map((file, idx) => ({
      id: `plan-${Date.now()}-${idx}`,
      name: file.name,
      type: file.type,
      size: file.size,
      pages: Math.floor(Math.random() * 10) + 5,
      status: 'uploading' as const,
      progress: 0,
    }));

    setPlans(prev => [...prev, ...newPlans]);

    // Simulate upload and processing
    newPlans.forEach((plan, idx) => {
      setTimeout(() => {
        setPlans(prev => prev.map(p => 
          p.id === plan.id ? { ...p, status: 'processing' as const, progress: 100 } : p
        ));
      }, 1000 + idx * 500);

      setTimeout(() => {
        setPlans(prev => prev.map(p => 
          p.id === plan.id ? { ...p, status: 'analyzed' as const, results: demoResults } : p
        ));
      }, 3000 + idx * 500);
    });
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 95) return 'text-green-600 bg-green-100';
    if (conf >= 85) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'surface': return <Square size={16} className="text-blue-500" />;
      case 'lineaire': return <Ruler size={16} className="text-green-500" />;
      case 'comptage': return <Grid size={16} className="text-purple-500" />;
      case 'volume': return <Box size={16} className="text-orange-500" />;
      default: return <Target size={16} />;
    }
  };

  const currentPlan = plans.find(p => p.id === selectedPlan);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="text-purple-600" />
            AI Takeoff Automatique
          </h1>
          <p className="text-gray-600">Extraction automatique des quantités par intelligence artificielle</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Settings size={18} />
            Paramètres IA
          </button>
          <button 
            onClick={startAnalysis}
            disabled={plans.length === 0 || isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isAnalyzing ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
            {isAnalyzing ? 'Analyse en cours...' : 'Lancer l\'analyse'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Plans analysés</p>
            <FileText size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{plans.filter(p => p.status === 'analyzed').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Éléments détectés</p>
            <Layers size={20} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-600">{demoResults.length * plans.filter(p => p.status === 'analyzed').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Confiance moyenne</p>
            <Target size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-600">95.2%</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Temps économisé</p>
            <Clock size={20} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2">~4h</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Précision</p>
            <Sparkles size={20} className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold mt-2">97%</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Zone d'upload et liste des plans */}
        <div className="space-y-4">
          {/* Upload Zone */}
          <div 
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-8 text-center hover:border-purple-400 transition-colors"
          >
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="font-medium text-gray-700 mb-2">Glissez vos plans ici</p>
            <p className="text-sm text-gray-500 mb-4">PDF, DWG, DXF, IFC, RVT</p>
            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-block">
                Sélectionner des fichiers
              </span>
              <input 
                type="file" 
                multiple 
                accept=".pdf,.dwg,.dxf,.ifc,.rvt"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              />
            </label>
          </div>

          {/* Liste des plans */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Plans ({plans.length})
              </h3>
            </div>
            <div className="divide-y max-h-96 overflow-auto">
              {plans.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Image size={32} className="mx-auto text-gray-300 mb-2" />
                  <p>Aucun plan importé</p>
                </div>
              ) : (
                plans.map((plan) => (
                  <div 
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedPlan === plan.id ? 'bg-purple-50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <File size={16} className="text-gray-400" />
                        <span className="font-medium text-sm truncate max-w-[150px]">{plan.name}</span>
                      </div>
                      {plan.status === 'uploading' && <Clock size={16} className="text-gray-400 animate-pulse" />}
                      {plan.status === 'processing' && <RefreshCw size={16} className="text-blue-500 animate-spin" />}
                      {plan.status === 'analyzed' && <CheckCircle size={16} className="text-green-500" />}
                      {plan.status === 'error' && <AlertTriangle size={16} className="text-red-500" />}
                    </div>
                    {plan.status === 'uploading' && (
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    )}
                    {plan.status === 'processing' && (
                      <p className="text-xs text-blue-600">Analyse IA en cours...</p>
                    )}
                    {plan.status === 'analyzed' && (
                      <p className="text-xs text-green-600">{plan.results?.length || 0} éléments détectés</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mode d'analyse */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-3">Mode d'analyse</h3>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${analysisMode === 'auto' ? 'border-purple-500 bg-purple-50' : ''}`}>
                <input 
                  type="radio" 
                  name="mode" 
                  checked={analysisMode === 'auto'}
                  onChange={() => setAnalysisMode('auto')}
                  className="text-purple-600"
                />
                <div>
                  <p className="font-medium">Automatique</p>
                  <p className="text-xs text-gray-500">L'IA détecte tous les éléments</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${analysisMode === 'guided' ? 'border-purple-500 bg-purple-50' : ''}`}>
                <input 
                  type="radio" 
                  name="mode" 
                  checked={analysisMode === 'guided'}
                  onChange={() => setAnalysisMode('guided')}
                  className="text-purple-600"
                />
                <div>
                  <p className="font-medium">Guidé</p>
                  <p className="text-xs text-gray-500">Spécifiez les éléments à chercher</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Visualisation du plan */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Visualisation</h3>
            <div className="flex gap-2">
              <button className="p-2 border rounded hover:bg-gray-50">
                <Eye size={16} />
              </button>
              <button className="p-2 border rounded hover:bg-gray-50">
                <Layers size={16} />
              </button>
            </div>
          </div>
          <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative">
            {selectedPlan && currentPlan?.status === 'analyzed' ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                {/* Simulated detected zones */}
                <div className="absolute top-10 left-10 w-40 h-32 border-2 border-blue-500 bg-blue-500/10 rounded" />
                <div className="absolute top-20 right-20 w-24 h-24 border-2 border-green-500 bg-green-500/10 rounded" />
                <div className="absolute bottom-20 left-1/4 w-32 h-20 border-2 border-purple-500 bg-purple-500/10 rounded" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center bg-white/90 p-4 rounded-lg shadow">
                    <Brain size={32} className="mx-auto text-purple-500 mb-2" />
                    <p className="font-medium">Zones détectées</p>
                    <p className="text-sm text-gray-500">Cliquez pour voir les détails</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">
                <FileText size={48} className="mx-auto text-gray-300 mb-2" />
                <p>Sélectionnez un plan analysé</p>
              </div>
            )}
          </div>
        </div>

        {/* Résultats de l'analyse */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 size={18} className="text-purple-600" />
                Résultats de l'analyse
              </h3>
              <button className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                <Download size={14} />
                Exporter
              </button>
            </div>
            <div className="divide-y max-h-[500px] overflow-auto">
              {(currentPlan?.results || demoResults).map((result) => (
                <div key={result.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(result.type)}
                      <span className="font-medium text-sm">{result.element}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getConfidenceColor(result.confiance)}`}>
                      {result.confiance}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-2xl font-bold text-purple-600">
                      {result.quantite.toLocaleString()} <span className="text-sm font-normal text-gray-500">{result.unite}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Page {result.page}</span>
                    {result.zone && <span>Zone: {result.zone}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-3">Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <CheckCircle size={18} />
                Valider et transférer au devis
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg hover:bg-gray-50">
                <RefreshCw size={18} />
                Réanalyser
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg hover:bg-gray-50">
                <Download size={18} />
                Exporter Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Paramètres IA</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle IA</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option>Claude Vision (Recommandé)</option>
                  <option>OpenAI GPT-4 Vision</option>
                  <option>Modèle personnalisé DAST</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seuil de confiance minimum</label>
                <input type="range" min="50" max="99" defaultValue="85" className="w-full" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>50%</span>
                  <span>85%</span>
                  <span>99%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Types d'éléments à détecter</label>
                <div className="space-y-2">
                  {['Surfaces', 'Linéaires', 'Comptages', 'Volumes'].map(type => (
                    <label key={type} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Échelle par défaut</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option>Détection automatique</option>
                  <option>1:50</option>
                  <option>1:100</option>
                  <option>1:200</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITakeoffModule;
