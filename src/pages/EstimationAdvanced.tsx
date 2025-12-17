/**
 * DAST Solutions - Page Estimation/Devis Avancée
 * Réception des items du Takeoff AI et génération de devis
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Save, Download, Send, Calculator, FileText,
  ChevronDown, ChevronUp, Edit2, Copy, Percent, DollarSign,
  Package, Users, Wrench, Truck, AlertCircle, Check, X,
  RefreshCw, Eye, Printer, FileSpreadsheet, Loader2,
  Import, ArrowLeftRight
} from 'lucide-react';
import {
  downloadSoumissionPDF,
  calculateSoumissionTotals,
  generateSoumissionNumber,
  DEFAULT_TEMPLATES,
  DEFAULT_CONDITIONS,
  type SoumissionData,
  type SoumissionItem
} from '@/services/pdfSoumissionAdvanced';
import { excelService, EXCEL_TEMPLATES } from '@/services/excelServiceAdvanced';
import { CSC_CATEGORIES, type TakeoffItem } from '@/services/aiTakeoffService';

// ============================================================================
// TYPES
// ============================================================================
interface EstimationItem extends SoumissionItem {
  id: string;
  source: 'manual' | 'takeoff' | 'imported';
  coutMateriel?: number;
  coutMainOeuvre?: number;
  coutEquipement?: number;
  heuresMO?: number;
  tauxMO?: number;
}

interface EstimationProject {
  id?: string;
  nom: string;
  client: string;
  adresse?: string;
  dateDebut?: string;
  dateFin?: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function EstimationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // États projet
  const [project, setProject] = useState<EstimationProject>({
    nom: '',
    client: ''
  });
  
  // États items
  const [items, setItems] = useState<EstimationItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // États calculs
  const [margePercent, setMargePercent] = useState(15);
  const [rabaisPercent, setRabaisPercent] = useState(0);
  const [contingencePercent, setContingencePercent] = useState(5);
  
  // États UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  
  // Charger les items du Takeoff depuis localStorage
  useEffect(() => {
    const takeoffItems = localStorage.getItem('takeoff_items');
    if (takeoffItems) {
      try {
        const parsed: TakeoffItem[] = JSON.parse(takeoffItems);
        const converted: EstimationItem[] = parsed.map((ti, index) => ({
          id: ti.id,
          numero: index + 1,
          description: ti.description,
          categorie: CSC_CATEGORIES[ti.category as keyof typeof CSC_CATEGORIES]?.name || ti.category,
          quantite: ti.quantity,
          unite: ti.unit,
          prixUnitaire: ti.unitPrice,
          total: ti.totalPrice,
          source: 'takeoff',
          coutMateriel: ti.materialCost,
          heuresMO: ti.laborHours,
          tauxMO: ti.laborRate,
          coutEquipement: ti.equipmentCost
        }));
        setItems(prev => [...prev, ...converted]);
        
        // Étendre toutes les catégories
        const cats = new Set(converted.map(i => i.categorie));
        setExpandedCategories(cats);
        
        // Nettoyer
        localStorage.removeItem('takeoff_items');
      } catch (e) {
        console.error('Erreur parsing takeoff items:', e);
      }
    }
  }, []);
  
  // Grouper les items par catégorie
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, EstimationItem[]> = {};
    items.forEach(item => {
      if (!grouped[item.categorie]) {
        grouped[item.categorie] = [];
      }
      grouped[item.categorie].push(item);
    });
    return grouped;
  }, [items]);
  
  // Calculs totaux
  const totals = useMemo(() => {
    const sousTotal = items.reduce((sum, i) => sum + i.total, 0);
    const rabais = sousTotal * rabaisPercent / 100;
    const apresRabais = sousTotal - rabais;
    const contingence = apresRabais * contingencePercent / 100;
    const avantMarge = apresRabais + contingence;
    const marge = avantMarge * margePercent / 100;
    const avantTaxes = avantMarge + marge;
    const tps = avantTaxes * 0.05;
    const tvq = avantTaxes * 0.09975;
    const total = avantTaxes + tps + tvq;
    
    // Répartition des coûts
    const totalMateriel = items.reduce((sum, i) => sum + (i.coutMateriel || 0), 0);
    const totalMO = items.reduce((sum, i) => sum + ((i.heuresMO || 0) * (i.tauxMO || 0)), 0);
    const totalEquipement = items.reduce((sum, i) => sum + (i.coutEquipement || 0), 0);
    const totalHeures = items.reduce((sum, i) => sum + (i.heuresMO || 0), 0);
    
    return {
      sousTotal,
      rabais,
      contingence,
      marge,
      tps,
      tvq,
      total,
      totalMateriel,
      totalMO,
      totalEquipement,
      totalHeures
    };
  }, [items, margePercent, rabaisPercent, contingencePercent]);
  
  // Ajouter un item
  const addItem = (categorie: string = 'Général') => {
    const newItem: EstimationItem = {
      id: `item-${Date.now()}`,
      numero: items.length + 1,
      description: '',
      categorie,
      quantite: 0,
      unite: 'unité',
      prixUnitaire: 0,
      total: 0,
      source: 'manual'
    };
    setItems([...items, newItem]);
    setEditingItem(newItem.id);
    setExpandedCategories(prev => new Set([...prev, categorie]));
  };
  
  // Modifier un item
  const updateItem = (id: string, updates: Partial<EstimationItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };
      // Recalculer le total
      updated.total = updated.quantite * updated.prixUnitaire;
      return updated;
    }));
  };
  
  // Supprimer un item
  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };
  
  // Dupliquer un item
  const duplicateItem = (item: EstimationItem) => {
    const newItem: EstimationItem = {
      ...item,
      id: `item-${Date.now()}`,
      numero: items.length + 1,
      source: 'manual'
    };
    setItems([...items, newItem]);
  };
  
  // Importer depuis Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const result = await excelService.importFile<any>(file, EXCEL_TEMPLATES.estimation);
      
      if (result.success && result.data.length > 0) {
        const imported: EstimationItem[] = result.data.map((row, index) => ({
          id: `import-${Date.now()}-${index}`,
          numero: items.length + index + 1,
          description: row.description || '',
          categorie: row.categorie || 'Importé',
          quantite: row.quantite || 0,
          unite: row.unite || 'unité',
          prixUnitaire: row.prixUnitaire || 0,
          total: (row.quantite || 0) * (row.prixUnitaire || 0),
          source: 'imported',
          notes: row.notes
        }));
        
        setItems(prev => [...prev, ...imported]);
        alert(`${imported.length} item(s) importé(s) avec succès`);
      } else {
        alert('Erreur lors de l\'import: ' + result.errors.map(e => e.message).join(', '));
      }
    } catch (err) {
      console.error('Erreur import:', err);
      alert('Erreur lors de l\'import');
    } finally {
      setLoading(false);
      setShowImport(false);
    }
  };
  
  // Exporter vers Excel
  const handleExportExcel = () => {
    const exportData = items.map(item => ({
      numero: item.numero,
      categorie: item.categorie,
      description: item.description,
      quantite: item.quantite,
      unite: item.unite,
      prixUnitaire: item.prixUnitaire,
      total: item.total,
      notes: item.notes || ''
    }));
    
    excelService.exportToExcel(exportData, EXCEL_TEMPLATES.estimation, `estimation_${project.nom || 'projet'}.xlsx`);
  };
  
  // Générer PDF
  const handleGeneratePDF = () => {
    const soumissionData: SoumissionData = {
      numero: generateSoumissionNumber(),
      date: new Date().toLocaleDateString('fr-CA'),
      validite: 30,
      entreprise: {
        nom: 'DAST Solutions',
        adresse: '123 rue Exemple',
        ville: 'Montréal',
        province: 'QC',
        codePostal: 'H1A 1A1',
        telephone: '514-555-1234',
        courriel: 'info@dastsolutions.ca',
        rbq: '1234-5678-90'
      },
      client: {
        nom: project.client || 'Client',
        adresse: project.adresse || '',
        ville: '',
        province: 'QC',
        codePostal: ''
      },
      projet: {
        nom: project.nom || 'Projet',
        adresse: project.adresse,
        dateDebut: project.dateDebut,
        dateFin: project.dateFin
      },
      items: items.map(i => ({
        numero: i.numero,
        description: i.description,
        categorie: i.categorie,
        quantite: i.quantite,
        unite: i.unite,
        prixUnitaire: i.prixUnitaire,
        total: i.total
      })),
      sousTotal: totals.sousTotal,
      rabais: rabaisPercent,
      rabaisType: 'percent',
      marge: margePercent,
      margeType: 'percent',
      tps: totals.tps,
      tvq: totals.tvq,
      total: totals.total,
      conditions: DEFAULT_CONDITIONS.slice(0, 5),
      signature: {
        nom: 'Représentant',
        titre: 'Estimateur',
        date: new Date().toLocaleDateString('fr-CA')
      }
    };
    
    downloadSoumissionPDF(soumissionData, DEFAULT_TEMPLATES[0]);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Estimation / Devis
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {items.length} item(s) • Total: {totals.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <Import size={18} />
              Importer
            </button>
            
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <FileSpreadsheet size={18} />
              Excel
            </button>
            
            <button
              onClick={handleGeneratePDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <FileText size={18} />
              Générer PDF
            </button>
          </div>
        </div>
        
        {/* Infos projet */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={project.nom}
            onChange={(e) => setProject(p => ({ ...p, nom: e.target.value }))}
            placeholder="Nom du projet"
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-700"
          />
          <input
            type="text"
            value={project.client}
            onChange={(e) => setProject(p => ({ ...p, client: e.target.value }))}
            placeholder="Nom du client"
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-700"
          />
          <input
            type="text"
            value={project.adresse || ''}
            onChange={(e) => setProject(p => ({ ...p, adresse: e.target.value }))}
            placeholder="Adresse du projet"
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-700"
          />
          <input
            type="date"
            value={project.dateDebut || ''}
            onChange={(e) => setProject(p => ({ ...p, dateDebut: e.target.value }))}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-700"
          />
        </div>
      </div>
      
      <div className="flex">
        {/* Liste des items */}
        <div className="flex-1 p-6">
          {/* Actions */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => addItem()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <Plus size={18} />
              Ajouter un item
            </button>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {items.filter(i => i.source === 'takeoff').length} du takeoff
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                {items.filter(i => i.source === 'manual').length} manuel(s)
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                {items.filter(i => i.source === 'imported').length} importé(s)
              </span>
            </div>
          </div>
          
          {/* Items par catégorie */}
          <div className="space-y-4">
            {Object.entries(itemsByCategory).map(([categorie, categoryItems]) => (
              <div key={categorie} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                {/* En-tête catégorie */}
                <button
                  onClick={() => setExpandedCategories(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(categorie)) {
                      newSet.delete(categorie);
                    } else {
                      newSet.add(categorie);
                    }
                    return newSet;
                  })}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    {expandedCategories.has(categorie) ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    <span className="font-semibold">{categorie}</span>
                    <span className="text-sm text-gray-500">({categoryItems.length} item(s))</span>
                  </div>
                  <span className="font-semibold">
                    {categoryItems.reduce((sum, i) => sum + i.total, 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </span>
                </button>
                
                {/* Items */}
                {expandedCategories.has(categorie) && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr className="text-xs text-gray-500 uppercase">
                          <th className="px-4 py-2 text-left w-8">#</th>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-right w-24">Qté</th>
                          <th className="px-4 py-2 text-center w-20">Unité</th>
                          <th className="px-4 py-2 text-right w-28">Prix unit.</th>
                          <th className="px-4 py-2 text-right w-28">Total</th>
                          <th className="px-4 py-2 text-center w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryItems.map(item => (
                          <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-2 text-sm text-gray-500">{item.numero}</td>
                            <td className="px-4 py-2">
                              {editingItem === item.id ? (
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                  className="w-full px-2 py-1 border rounded dark:bg-gray-700"
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span>{item.description || '(sans description)'}</span>
                                  {item.source === 'takeoff' && (
                                    <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">AI</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {editingItem === item.id ? (
                                <input
                                  type="number"
                                  value={item.quantite}
                                  onChange={(e) => updateItem(item.id, { quantite: parseFloat(e.target.value) || 0 })}
                                  className="w-20 px-2 py-1 border rounded text-right dark:bg-gray-700"
                                />
                              ) : (
                                item.quantite.toFixed(2)
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {editingItem === item.id ? (
                                <input
                                  type="text"
                                  value={item.unite}
                                  onChange={(e) => updateItem(item.id, { unite: e.target.value })}
                                  className="w-16 px-2 py-1 border rounded text-center dark:bg-gray-700"
                                />
                              ) : (
                                item.unite
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {editingItem === item.id ? (
                                <input
                                  type="number"
                                  value={item.prixUnitaire}
                                  onChange={(e) => updateItem(item.id, { prixUnitaire: parseFloat(e.target.value) || 0 })}
                                  className="w-24 px-2 py-1 border rounded text-right dark:bg-gray-700"
                                />
                              ) : (
                                `${item.prixUnitaire.toFixed(2)} $`
                              )}
                            </td>
                            <td className="px-4 py-2 text-right font-medium">
                              {item.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center justify-center gap-1">
                                {editingItem === item.id ? (
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    <Check size={16} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setEditingItem(item.id)}
                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => duplicateItem(item)}
                                  className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => addItem(categorie)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Ajouter à cette catégorie
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300">
                <Calculator size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun item dans l'estimation</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => addItem()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Ajouter manuellement
                  </button>
                  <button
                    onClick={() => navigate('/takeoff')}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    Aller au Takeoff
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Panneau latéral - Totaux */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-bold text-lg mb-4">Résumé</h3>
          
          {/* Répartition des coûts */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <Package size={16} />
                Matériaux
              </span>
              <span>{totals.totalMateriel.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <Users size={16} />
                Main-d'œuvre ({totals.totalHeures.toFixed(0)}h)
              </span>
              <span>{totals.totalMO.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <Truck size={16} />
                Équipement
              </span>
              <span>{totals.totalEquipement.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
            </div>
          </div>
          
          <hr className="border-gray-200 dark:border-gray-700 my-4" />
          
          {/* Paramètres de marge */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Rabais (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={rabaisPercent}
                  onChange={(e) => setRabaisPercent(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-right">{rabaisPercent}%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Contingence (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={contingencePercent}
                  onChange={(e) => setContingencePercent(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-right">{contingencePercent}%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Marge de profit (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="35"
                  value={margePercent}
                  onChange={(e) => setMargePercent(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-right">{margePercent}%</span>
              </div>
            </div>
          </div>
          
          <hr className="border-gray-200 dark:border-gray-700 my-4" />
          
          {/* Totaux */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Sous-total</span>
              <span>{totals.sousTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
            </div>
            
            {totals.rabais > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Rabais ({rabaisPercent}%)</span>
                <span>-{totals.rabais.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
              </div>
            )}
            
            {totals.contingence > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Contingence ({contingencePercent}%)</span>
                <span>{totals.contingence.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Marge ({margePercent}%)</span>
              <span>{totals.marge.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
            </div>
            
            <hr className="border-gray-200 dark:border-gray-700 my-2" />
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TPS (5%)</span>
              <span>{totals.tps.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVQ (9.975%)</span>
              <span>{totals.tvq.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
            </div>
            
            <hr className="border-gray-200 dark:border-gray-700 my-2" />
            
            <div className="flex justify-between text-xl font-bold">
              <span>TOTAL</span>
              <span className="text-blue-600">{totals.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-6 space-y-2">
            <button
              onClick={handleGeneratePDF}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              Générer la soumission PDF
            </button>
            
            <button
              onClick={handleExportExcel}
              className="w-full py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <FileSpreadsheet size={20} />
              Exporter Excel
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal Import */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Importer depuis Excel</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Glissez un fichier Excel ou cliquez pour sélectionner</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportExcel}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
              >
                Sélectionner un fichier
              </label>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => excelService.downloadTemplate(EXCEL_TEMPLATES.estimation)}
                className="text-sm text-blue-600 hover:underline"
              >
                Télécharger le template Excel
              </button>
            </div>
            
            <button
              onClick={() => setShowImport(false)}
              className="w-full mt-4 py-2 border border-gray-300 rounded-lg"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
