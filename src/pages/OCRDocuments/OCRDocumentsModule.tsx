import React, { useState, useCallback } from 'react';
import { 
  ScanLine, Upload, FileText, CheckCircle, Clock, AlertTriangle,
  Eye, Download, Settings, Zap, RefreshCw, Layers, Grid3X3,
  Table, FileSpreadsheet, Copy, Check, X, Sparkles, Target,
  Building2, DollarSign, Calendar, User, Hash, ChevronRight
} from 'lucide-react';

interface ExtractedField {
  id: string;
  champ: string;
  valeur: string;
  confiance: number;
  type: 'texte' | 'montant' | 'date' | 'numero';
  verifie: boolean;
}

interface ExtractedItem {
  id: string;
  description: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  total: number;
  confiance: number;
}

interface Document {
  id: string;
  name: string;
  type: 'devis' | 'facture' | 'bon_commande' | 'autre';
  status: 'uploading' | 'processing' | 'extracted' | 'verified' | 'error';
  dateUpload: string;
  fields?: ExtractedField[];
  items?: ExtractedItem[];
}

const OCRDocumentsModule: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [demoFields] = useState<ExtractedField[]>([
    { id: '1', champ: 'Fournisseur', valeur: 'Béton Québec Inc.', confiance: 98, type: 'texte', verifie: true },
    { id: '2', champ: 'Numéro de facture', valeur: 'FAC-2026-00458', confiance: 99, type: 'numero', verifie: true },
    { id: '3', champ: 'Date', valeur: '2026-01-10', confiance: 97, type: 'date', verifie: true },
    { id: '4', champ: 'Adresse', valeur: '1250 rue Industrielle, Laval QC H7L 4S3', confiance: 94, type: 'texte', verifie: false },
    { id: '5', champ: 'Sous-total', valeur: '45,250.00 $', confiance: 96, type: 'montant', verifie: true },
    { id: '6', champ: 'TPS (5%)', valeur: '2,262.50 $', confiance: 98, type: 'montant', verifie: true },
    { id: '7', champ: 'TVQ (9.975%)', valeur: '4,513.69 $', confiance: 98, type: 'montant', verifie: true },
    { id: '8', champ: 'Total', valeur: '52,026.19 $', confiance: 99, type: 'montant', verifie: true },
  ]);

  const [demoItems] = useState<ExtractedItem[]>([
    { id: '1', description: 'Béton 30 MPa - Livraison chantier Tour Deloitte', quantite: 85, unite: 'm³', prixUnitaire: 285, total: 24225, confiance: 96 },
    { id: '2', description: 'Pompage béton - Hauteur 15m+', quantite: 85, unite: 'm³', prixUnitaire: 45, total: 3825, confiance: 94 },
    { id: '3', description: 'Adjuvant superplastifiant', quantite: 425, unite: 'L', prixUnitaire: 12.50, total: 5312.50, confiance: 92 },
    { id: '4', description: 'Fibres polypropylène', quantite: 170, unite: 'kg', prixUnitaire: 8.75, total: 1487.50, confiance: 91 },
    { id: '5', description: 'Frais de transport', quantite: 1, unite: 'forfait', prixUnitaire: 850, total: 850, confiance: 98 },
    { id: '6', description: 'Location pompe stationnaire (8h)', quantite: 1, unite: 'jour', prixUnitaire: 2500, total: 2500, confiance: 95 },
    { id: '7', description: 'Main d\'œuvre - Technicien béton', quantite: 16, unite: 'heures', prixUnitaire: 65, total: 1040, confiance: 93 },
    { id: '8', description: 'Tests cylindres (série de 4)', quantite: 3, unite: 'série', prixUnitaire: 185, total: 555, confiance: 97 },
  ]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const newDocs: Document[] = files.map((file, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      name: file.name,
      type: 'facture' as const,
      status: 'uploading' as const,
      dateUpload: new Date().toISOString().split('T')[0],
    }));

    setDocuments(prev => [...prev, ...newDocs]);

    // Simulate processing
    newDocs.forEach((doc, idx) => {
      setTimeout(() => {
        setDocuments(prev => prev.map(d => 
          d.id === doc.id ? { ...d, status: 'processing' as const } : d
        ));
      }, 500 + idx * 300);

      setTimeout(() => {
        setDocuments(prev => prev.map(d => 
          d.id === doc.id ? { ...d, status: 'extracted' as const, fields: demoFields, items: demoItems } : d
        ));
        if (idx === 0) setSelectedDoc(doc.id);
      }, 2000 + idx * 300);
    });
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 95) return 'text-green-600 bg-green-100';
    if (conf >= 85) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'texte': return <FileText size={14} className="text-gray-500" />;
      case 'montant': return <DollarSign size={14} className="text-green-500" />;
      case 'date': return <Calendar size={14} className="text-blue-500" />;
      case 'numero': return <Hash size={14} className="text-purple-500" />;
      default: return <FileText size={14} />;
    }
  };

  const currentDoc = documents.find(d => d.id === selectedDoc);

  const stats = {
    total: documents.length,
    traites: documents.filter(d => d.status === 'extracted' || d.status === 'verified').length,
    enCours: documents.filter(d => d.status === 'processing').length,
    precision: 95.8,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ScanLine className="text-orange-600" />
            OCR Documents
          </h1>
          <p className="text-gray-600">Extraction automatique des données de devis et factures</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Settings size={18} />
            Paramètres
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            <Zap size={18} />
            Traitement par lot
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Documents</p>
            <FileText size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Traités</p>
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-600">{stats.traites}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">En cours</p>
            <RefreshCw size={20} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-orange-600">{stats.enCours}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Précision OCR</p>
            <Target size={20} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-600">{stats.precision}%</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Zone upload et liste documents */}
        <div className="space-y-4">
          {/* Upload Zone */}
          <div 
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-6 text-center hover:border-orange-400 transition-colors"
          >
            <Upload size={40} className="mx-auto text-gray-400 mb-3" />
            <p className="font-medium text-gray-700 mb-1">Glissez vos documents</p>
            <p className="text-sm text-gray-500 mb-3">PDF, JPG, PNG, TIFF</p>
            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 inline-block text-sm">
                Parcourir
              </span>
              <input 
                type="file" 
                multiple 
                accept=".pdf,.jpg,.jpeg,.png,.tiff"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              />
            </label>
          </div>

          {/* Liste documents */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">Documents ({documents.length})</h3>
            </div>
            <div className="divide-y max-h-80 overflow-auto">
              {documents.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  Aucun document
                </div>
              ) : (
                documents.map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc.id)}
                    className={`p-3 hover:bg-gray-50 cursor-pointer ${selectedDoc === doc.id ? 'bg-orange-50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate max-w-[140px]">{doc.name}</span>
                      {doc.status === 'uploading' && <Clock size={14} className="text-gray-400 animate-pulse" />}
                      {doc.status === 'processing' && <RefreshCw size={14} className="text-orange-500 animate-spin" />}
                      {doc.status === 'extracted' && <CheckCircle size={14} className="text-green-500" />}
                      {doc.status === 'verified' && <Check size={14} className="text-blue-500" />}
                    </div>
                    <p className="text-xs text-gray-500">{doc.dateUpload}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Aperçu document */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm">Aperçu</h3>
            <button className="p-1 hover:bg-gray-100 rounded">
              <Eye size={16} />
            </button>
          </div>
          <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
            {selectedDoc && currentDoc?.status === 'extracted' ? (
              <div className="w-full h-full bg-white p-4 overflow-auto text-xs">
                <div className="border-b pb-2 mb-2">
                  <p className="font-bold">FACTURE</p>
                  <p className="text-gray-500">Béton Québec Inc.</p>
                </div>
                <div className="space-y-1">
                  <p><span className="text-gray-500">No:</span> FAC-2026-00458</p>
                  <p><span className="text-gray-500">Date:</span> 2026-01-10</p>
                </div>
                <div className="mt-4 border-t pt-2">
                  <p className="font-medium mb-1">Articles:</p>
                  {demoItems.slice(0, 4).map((item, i) => (
                    <p key={i} className="text-gray-600 truncate">{item.description}</p>
                  ))}
                  <p className="text-gray-400">...</p>
                </div>
                <div className="mt-4 border-t pt-2 text-right">
                  <p className="font-bold">Total: 52,026.19 $</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <FileText size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Sélectionnez un document</p>
              </div>
            )}
          </div>
        </div>

        {/* Données extraites */}
        <div className="col-span-2 space-y-4">
          {currentDoc?.status === 'extracted' ? (
            <>
              {/* Champs extraits */}
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Grid3X3 size={18} className="text-orange-600" />
                    Champs extraits
                  </h3>
                  <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Copy size={14} />
                    Copier tout
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4">
                  {(currentDoc.fields || demoFields).map((field) => (
                    <div key={field.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(field.type)}
                          <span className="text-sm text-gray-500">{field.champ}</span>
                        </div>
                        <p className="font-medium">{field.valeur}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor(field.confiance)}`}>
                          {field.confiance}%
                        </span>
                        {field.verifie && <Check size={14} className="text-green-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tableau des items */}
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Table size={18} className="text-blue-600" />
                    Lignes de facturation ({demoItems.length})
                  </h3>
                  <button className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <FileSpreadsheet size={14} />
                    Exporter Excel
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-medium text-gray-500">Description</th>
                        <th className="text-right p-3 font-medium text-gray-500">Qté</th>
                        <th className="text-right p-3 font-medium text-gray-500">P.U.</th>
                        <th className="text-right p-3 font-medium text-gray-500">Total</th>
                        <th className="text-center p-3 font-medium text-gray-500">Conf.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(currentDoc.items || demoItems).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-3">{item.description}</td>
                          <td className="p-3 text-right">{item.quantite} {item.unite}</td>
                          <td className="p-3 text-right">{item.prixUnitaire.toFixed(2)}$</td>
                          <td className="p-3 text-right font-medium">{item.total.toFixed(2)}$</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor(item.confiance)}`}>
                              {item.confiance}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <CheckCircle size={18} />
                  Valider et importer
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 border rounded-lg hover:bg-gray-50">
                  <RefreshCw size={18} />
                  Réanalyser
                </button>
                <button className="px-4 py-3 border rounded-lg hover:bg-gray-50">
                  <Download size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <ScanLine size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">Importez un document pour extraire les données</p>
              <p className="text-sm text-gray-400">L'IA extraira automatiquement les champs et lignes de facturation</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Paramètres OCR</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moteur OCR</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option>Google Cloud Vision (Recommandé)</option>
                  <option>AWS Textract</option>
                  <option>Azure Form Recognizer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Langue principale</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option>Français (Canada)</option>
                  <option>Anglais</option>
                  <option>Bilingue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de document par défaut</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option>Facture</option>
                  <option>Devis</option>
                  <option>Bon de commande</option>
                  <option>Détection automatique</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-orange-600" />
                  <span className="text-sm">Validation automatique si confiance &gt; 95%</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-orange-600" />
                  <span className="text-sm">Extraire les tableaux</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRDocumentsModule;
