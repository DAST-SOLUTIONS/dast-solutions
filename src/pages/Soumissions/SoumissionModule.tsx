/**
 * DAST Solutions - Module Soumission Avancé
 * Création, édition et gestion des soumissions avec templates
 */
import { useState, useEffect } from 'react';
import {
  FileText, Save, Download, Send, Eye, Printer, Plus, Trash2,
  Calculator, DollarSign, Percent, Calendar, User, Building2,
  ChevronDown, ChevronUp, Copy, History, FileEdit, CheckCircle,
  AlertCircle, Loader2, Settings, Palette, X, Upload
} from 'lucide-react';
import {
  generateSoumissionPDF,
  downloadSoumissionPDF,
  calculateSoumissionTotals,
  generateSoumissionNumber,
  DEFAULT_TEMPLATES,
  DEFAULT_CONDITIONS,
  type SoumissionData,
  type SoumissionItem,
  type PDFTemplate
} from '@/services/pdfSoumissionAdvanced';
import { CSC_CATEGORIES } from '@/services/aiTakeoffService';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function SoumissionModule() {
  // États de base
  const [numero, setNumero] = useState(() => generateSoumissionNumber());
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [validite, setValidite] = useState(30);
  
  // Entreprise
  const [entreprise, setEntreprise] = useState({
    nom: 'DAST Solutions Inc.',
    adresse: '123 Rue Construction',
    ville: 'Montréal',
    province: 'QC',
    codePostal: 'H2X 1Y2',
    telephone: '514-555-1234',
    courriel: 'info@dastsolutions.ca',
    siteWeb: 'www.dastsolutions.ca',
    rbq: '1234-5678-90',
    neq: '1234567890'
  });
  
  // Client
  const [client, setClient] = useState({
    nom: '',
    entreprise: '',
    adresse: '',
    ville: '',
    province: 'QC',
    codePostal: '',
    telephone: '',
    courriel: ''
  });
  
  // Projet
  const [projet, setProjet] = useState({
    nom: '',
    adresse: '',
    description: ''
  });
  
  // Items
  const [items, setItems] = useState<SoumissionItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<SoumissionItem | null>(null);
  
  // Montants
  const [margePercent, setMargePercent] = useState(15);
  const [rabaisPercent, setRabaisPercent] = useState(0);
  
  // Conditions
  const [conditions, setConditions] = useState<string[]>(DEFAULT_CONDITIONS.slice(0, 5));
  const [notes, setNotes] = useState('');
  
  // Template
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate>(DEFAULT_TEMPLATES[0]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Signature
  const [signature, setSignature] = useState({
    nom: '',
    titre: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // UI States
  const [activeSection, setActiveSection] = useState<string>('client');
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Import items from takeoff
  useEffect(() => {
    const takeoffItems = localStorage.getItem('takeoff_items');
    if (takeoffItems) {
      try {
        const parsed = JSON.parse(takeoffItems);
        const converted: SoumissionItem[] = parsed.map((item: any, idx: number) => ({
          numero: idx + 1,
          description: item.description,
          categorie: CSC_CATEGORIES[item.category as keyof typeof CSC_CATEGORIES]?.name || item.category,
          quantite: item.quantity || item.quantite || 0,
          unite: item.unit || item.unite || 'unité',
          prixUnitaire: item.unitPrice || item.prixUnitaire || 0,
          total: item.totalPrice || item.total || 0
        }));
        setItems(prev => [...prev, ...converted]);
        localStorage.removeItem('takeoff_items');
      } catch (e) {
        console.error('Erreur import takeoff items:', e);
      }
    }
  }, []);
  
  // ============================================================================
  // CALCULS
  // ============================================================================
  const totals = calculateSoumissionTotals(items, margePercent, rabaisPercent);
  
  // ============================================================================
  // GESTION DES ITEMS
  // ============================================================================
  const addItem = (item: Omit<SoumissionItem, 'numero'>) => {
    const newItem: SoumissionItem = {
      ...item,
      numero: items.length + 1,
      total: item.quantite * item.prixUnitaire
    };
    setItems([...items, newItem]);
    setShowAddItem(false);
  };
  
  const updateItem = (item: SoumissionItem) => {
    setItems(items.map(i => i.numero === item.numero ? { ...item, total: item.quantite * item.prixUnitaire } : i));
    setEditingItem(null);
  };
  
  const deleteItem = (numero: number) => {
    setItems(items.filter(i => i.numero !== numero).map((i, idx) => ({ ...i, numero: idx + 1 })));
  };
  
  const duplicateItem = (item: SoumissionItem) => {
    const newItem: SoumissionItem = {
      ...item,
      numero: items.length + 1
    };
    setItems([...items, newItem]);
  };
  
  // ============================================================================
  // EXPORT PDF
  // ============================================================================
  const handleExportPDF = () => {
    const data: SoumissionData = {
      numero,
      date,
      validite,
      entreprise,
      client,
      projet,
      items,
      sousTotal: totals.sousTotal,
      rabais: rabaisPercent,
      rabaisType: 'percent',
      marge: margePercent,
      margeType: 'percent',
      tps: totals.tps,
      tvq: totals.tvq,
      total: totals.total,
      conditions,
      notes: notes || undefined,
      signature: signature.nom ? signature : undefined
    };
    
    downloadSoumissionPDF(data, selectedTemplate);
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="text-blue-600" />
                Nouvelle Soumission
              </h1>
              <p className="text-sm text-gray-500">#{numero}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Palette size={18} />
                Template
              </button>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  previewMode ? 'bg-blue-100 text-blue-700' : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Eye size={18} />
                Aperçu
              </button>
              <button
                onClick={handleExportPDF}
                disabled={items.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
              >
                <Download size={18} />
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section Client */}
            <SectionCard
              title="Client"
              icon={<User size={20} />}
              isOpen={activeSection === 'client'}
              onToggle={() => setActiveSection(activeSection === 'client' ? '' : 'client')}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nom du client *</label>
                  <input
                    type="text"
                    value={client.nom}
                    onChange={(e) => setClient({ ...client, nom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Entreprise</label>
                  <input
                    type="text"
                    value={client.entreprise}
                    onChange={(e) => setClient({ ...client, entreprise: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Adresse</label>
                  <input
                    type="text"
                    value={client.adresse}
                    onChange={(e) => setClient({ ...client, adresse: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ville</label>
                  <input
                    type="text"
                    value={client.ville}
                    onChange={(e) => setClient({ ...client, ville: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="w-20">
                    <label className="block text-sm font-medium mb-1">Prov.</label>
                    <select
                      value={client.province}
                      onChange={(e) => setClient({ ...client, province: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="QC">QC</option>
                      <option value="ON">ON</option>
                      <option value="BC">BC</option>
                      <option value="AB">AB</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Code postal</label>
                    <input
                      type="text"
                      value={client.codePostal}
                      onChange={(e) => setClient({ ...client, codePostal: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={client.telephone}
                    onChange={(e) => setClient({ ...client, telephone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Courriel</label>
                  <input
                    type="email"
                    value={client.courriel}
                    onChange={(e) => setClient({ ...client, courriel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            </SectionCard>
            
            {/* Section Projet */}
            <SectionCard
              title="Projet"
              icon={<Building2 size={20} />}
              isOpen={activeSection === 'projet'}
              onToggle={() => setActiveSection(activeSection === 'projet' ? '' : 'projet')}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du projet *</label>
                  <input
                    type="text"
                    value={projet.nom}
                    onChange={(e) => setProjet({ ...projet, nom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Adresse du projet</label>
                  <input
                    type="text"
                    value={projet.adresse}
                    onChange={(e) => setProjet({ ...projet, adresse: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={projet.description}
                    onChange={(e) => setProjet({ ...projet, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            </SectionCard>
            
            {/* Section Items */}
            <SectionCard
              title={`Items (${items.length})`}
              icon={<Calculator size={20} />}
              isOpen={activeSection === 'items'}
              onToggle={() => setActiveSection(activeSection === 'items' ? '' : 'items')}
              action={
                <button
                  onClick={() => setShowAddItem(true)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg flex items-center gap-1"
                >
                  <Plus size={14} />
                  Ajouter
                </button>
              }
            >
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calculator size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Aucun item dans cette soumission</p>
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="mt-2 text-blue-600 hover:underline"
                  >
                    Ajouter un item
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* En-tête */}
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 px-2">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2 text-right">Quantité</div>
                    <div className="col-span-2 text-right">Prix unit.</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {/* Items */}
                  {items.map(item => (
                    <div 
                      key={item.numero}
                      className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="col-span-1 text-sm font-medium">{item.numero}</div>
                      <div className="col-span-4">
                        <p className="font-medium text-sm">{item.description}</p>
                        <p className="text-xs text-gray-500">{item.categorie}</p>
                      </div>
                      <div className="col-span-2 text-right text-sm">
                        {item.quantite.toFixed(2)} {item.unite}
                      </div>
                      <div className="col-span-2 text-right text-sm">
                        {item.prixUnitaire.toFixed(2)} $
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {item.total.toFixed(2)} $
                      </div>
                      <div className="col-span-1 flex justify-end gap-1">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Modifier"
                        >
                          <FileEdit size={14} />
                        </button>
                        <button
                          onClick={() => duplicateItem(item)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Dupliquer"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.numero)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
            
            {/* Section Conditions */}
            <SectionCard
              title="Conditions"
              icon={<FileText size={20} />}
              isOpen={activeSection === 'conditions'}
              onToggle={() => setActiveSection(activeSection === 'conditions' ? '' : 'conditions')}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  {conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-gray-500 w-6">{index + 1}.</span>
                      <input
                        type="text"
                        value={condition}
                        onChange={(e) => {
                          const newConditions = [...conditions];
                          newConditions[index] = e.target.value;
                          setConditions(newConditions);
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600"
                      />
                      <button
                        onClick={() => setConditions(conditions.filter((_, i) => i !== index))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setConditions([...conditions, ''])}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus size={14} />
                  Ajouter une condition
                </button>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes additionnelles</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Notes visibles sur la soumission..."
                  />
                </div>
              </div>
            </SectionCard>
          </div>
          
          {/* Panneau latéral - Résumé */}
          <div className="space-y-6">
            {/* Totaux */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 sticky top-24">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                Résumé financier
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Sous-total ({items.length} items)</span>
                  <span className="font-medium">{totals.sousTotal.toFixed(2)} $</span>
                </div>
                
                {/* Rabais */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span>Rabais</span>
                    <input
                      type="number"
                      value={rabaisPercent}
                      onChange={(e) => setRabaisPercent(parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border rounded text-center text-sm dark:bg-gray-700"
                      min="0"
                      max="100"
                    />
                    <span>%</span>
                  </div>
                  <span className="text-green-600">-{totals.rabais.toFixed(2)} $</span>
                </div>
                
                {/* Marge */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span>Profit & frais</span>
                    <input
                      type="number"
                      value={margePercent}
                      onChange={(e) => setMargePercent(parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border rounded text-center text-sm dark:bg-gray-700"
                      min="0"
                    />
                    <span>%</span>
                  </div>
                  <span>{totals.marge.toFixed(2)} $</span>
                </div>
                
                <div className="border-t dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-sm">
                    <span>TPS (5%)</span>
                    <span>{totals.tps.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVQ (9.975%)</span>
                    <span>{totals.tvq.toFixed(2)} $</span>
                  </div>
                </div>
                
                <div className="border-t dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-xl font-bold text-green-600">
                    <span>TOTAL</span>
                    <span>{totals.total.toFixed(2)} $</span>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={handleExportPDF}
                  disabled={items.length === 0 || !client.nom || !projet.nom}
                  className="w-full py-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50"
                >
                  <Download size={18} />
                  Télécharger PDF
                </button>
                <button
                  className="w-full py-3 border border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Send size={18} />
                  Envoyer par courriel
                </button>
              </div>
            </div>
            
            {/* Template actuel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Template</h4>
                <button
                  onClick={() => setShowTemplateSelector(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Changer
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: selectedTemplate.primaryColor }}
                />
                <div>
                  <p className="font-medium">{selectedTemplate.name}</p>
                  <p className="text-xs text-gray-500">Style {selectedTemplate.headerStyle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Ajouter Item */}
      {(showAddItem || editingItem) && (
        <ItemModal
          item={editingItem || undefined}
          onSave={(item) => editingItem ? updateItem({ ...item, numero: editingItem.numero }) : addItem(item)}
          onClose={() => {
            setShowAddItem(false);
            setEditingItem(null);
          }}
        />
      )}
      
      {/* Modal Sélection Template */}
      {showTemplateSelector && (
        <TemplateSelector
          selected={selectedTemplate}
          onSelect={(template) => {
            setSelectedTemplate(template);
            setShowTemplateSelector(false);
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// COMPOSANTS AUXILIAIRES
// ============================================================================

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, icon, isOpen, onToggle, action, children }: SectionCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-blue-600">{icon}</span>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

interface ItemModalProps {
  item?: SoumissionItem;
  onSave: (item: Omit<SoumissionItem, 'numero'>) => void;
  onClose: () => void;
}

function ItemModal({ item, onSave, onClose }: ItemModalProps) {
  const [form, setForm] = useState({
    description: item?.description || '',
    categorie: item?.categorie || 'Construction',
    quantite: item?.quantite || 1,
    unite: item?.unite || 'unité',
    prixUnitaire: item?.prixUnitaire || 0,
    notes: item?.notes || ''
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      total: form.quantite * form.prixUnitaire
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold mb-4">
          {item ? 'Modifier l\'item' : 'Ajouter un item'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie</label>
            <select
              value={form.categorie}
              onChange={(e) => setForm({ ...form, categorie: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              {Object.values(CSC_CATEGORIES).map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantité</label>
              <input
                type="number"
                value={form.quantite}
                onChange={(e) => setForm({ ...form, quantite: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unité</label>
              <select
                value={form.unite}
                onChange={(e) => setForm({ ...form, unite: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="unité">unité</option>
                <option value="pi">pi</option>
                <option value="pi²">pi²</option>
                <option value="pi.lin.">pi.lin.</option>
                <option value="m">m</option>
                <option value="m²">m²</option>
                <option value="hr">hr</option>
                <option value="jour">jour</option>
                <option value="forfait">forfait</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prix unit. ($)</label>
              <input
                type="number"
                value={form.prixUnitaire}
                onChange={(e) => setForm({ ...form, prixUnitaire: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="text-right text-lg font-bold text-green-600">
            Total: {(form.quantite * form.prixUnitaire).toFixed(2)} $
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {item ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TemplateSelectorProps {
  selected: PDFTemplate;
  onSelect: (template: PDFTemplate) => void;
  onClose: () => void;
}

function TemplateSelector({ selected, onSelect, onClose }: TemplateSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Choisir un template</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {DEFAULT_TEMPLATES.map(template => (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                selected.id === template.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-lg"
                  style={{ backgroundColor: template.primaryColor }}
                />
                <div>
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{template.headerStyle}</p>
                </div>
                {selected.id === template.id && (
                  <CheckCircle className="ml-auto text-blue-500" size={20} />
                )}
              </div>
              <div className="flex gap-2">
                <div 
                  className="w-6 h-4 rounded"
                  style={{ backgroundColor: template.primaryColor }}
                />
                <div 
                  className="w-6 h-4 rounded"
                  style={{ backgroundColor: template.secondaryColor }}
                />
                <div 
                  className="w-6 h-4 rounded"
                  style={{ backgroundColor: template.accentColor }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
