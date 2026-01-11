/**
 * DAST Solutions - Templates de Soumission
 * Modèles par type de projet + Calcul automatique des marges
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  FileText, Plus, Copy, Edit2, Trash2, Save, X, Check,
  Building2, Home, Building, Factory, Layers, DollarSign,
  Percent, TrendingUp, Clock, Star, MoreVertical, Search,
  ChevronRight, ChevronDown, Settings, Eye, Download,
  AlertTriangle, Info, CheckCircle, Calculator
} from 'lucide-react'

// Types
interface TemplateSection {
  id: string
  name: string
  description?: string
  items: TemplateItem[]
  subtotal: number
}

interface TemplateItem {
  id: string
  code: string
  description: string
  unit: string
  quantity: number
  unitPrice: number
  total: number
  margin: number
  notes?: string
}

interface SoumissionTemplate {
  id: string
  name: string
  description: string
  projectType: 'residential' | 'commercial' | 'institutional' | 'industrial'
  category: string
  sections: TemplateSection[]
  conditions: string[]
  exclusions: string[]
  defaultMargin: number
  suggestedMargin?: number
  validity: number // jours
  paymentTerms: string
  isDefault: boolean
  usageCount: number
  successRate?: number
  avgMargin?: number
  createdAt: string
  updatedAt: string
}

interface MarginAnalysis {
  projectType: string
  avgMargin: number
  minMargin: number
  maxMargin: number
  successRate: number
  totalBids: number
  wonBids: number
  avgBidAmount: number
  recommendation: string
}

// Constantes
const PROJECT_TYPES = [
  { id: 'residential', name: 'Résidentiel', icon: Home, color: 'bg-green-100 text-green-700' },
  { id: 'commercial', name: 'Commercial', icon: Building2, color: 'bg-blue-100 text-blue-700' },
  { id: 'institutional', name: 'Institutionnel', icon: Building, color: 'bg-purple-100 text-purple-700' },
  { id: 'industrial', name: 'Industriel', icon: Factory, color: 'bg-amber-100 text-amber-700' },
]

const CATEGORIES = [
  'Maçonnerie', 'Béton', 'Charpente', 'Structure acier',
  'Toiture', 'Revêtement extérieur', 'Excavation', 'Démolition',
  'Rénovation complète', 'Agrandissement', 'Construction neuve'
]

const DEFAULT_CONDITIONS = [
  'Prix ferme valide pour 30 jours',
  'Taxes en sus (TPS/TVQ)',
  'Permis et inspections à la charge du client',
  'Site accessible et dégagé pour les travaux',
  'Électricité et eau disponibles sur le chantier',
  'Heures de travail: lundi au vendredi, 7h à 17h',
  'Travaux exécutés selon les règles de l\'art et le Code du bâtiment'
]

const DEFAULT_EXCLUSIONS = [
  'Travaux non spécifiés dans la présente soumission',
  'Réparations de dommages préexistants',
  'Travaux de finition intérieure (sauf si spécifié)',
  'Aménagement paysager',
  'Équipements et mobilier'
]

// Templates par défaut
const DEFAULT_TEMPLATES: Partial<SoumissionTemplate>[] = [
  {
    name: 'Maçonnerie - Résidentiel',
    description: 'Template standard pour travaux de maçonnerie résidentielle',
    projectType: 'residential',
    category: 'Maçonnerie',
    defaultMargin: 15,
    validity: 30,
    paymentTerms: '50% début, 50% fin des travaux',
    sections: [
      {
        id: 'prep',
        name: 'Préparation',
        items: [
          { id: '1', code: 'PREP-01', description: 'Mobilisation / Démobilisation', unit: 'forf.', quantity: 1, unitPrice: 0, total: 0, margin: 15 },
          { id: '2', code: 'PREP-02', description: 'Installation échafaudage', unit: 'forf.', quantity: 1, unitPrice: 0, total: 0, margin: 15 },
        ],
        subtotal: 0
      },
      {
        id: 'macon',
        name: 'Travaux de maçonnerie',
        items: [
          { id: '3', code: 'MAC-01', description: 'Briques standard', unit: 'm²', quantity: 0, unitPrice: 0, total: 0, margin: 15 },
          { id: '4', code: 'MAC-02', description: 'Joints de mortier', unit: 'm²', quantity: 0, unitPrice: 0, total: 0, margin: 15 },
          { id: '5', code: 'MAC-03', description: 'Linteaux acier', unit: 'unité', quantity: 0, unitPrice: 0, total: 0, margin: 15 },
        ],
        subtotal: 0
      }
    ],
    conditions: DEFAULT_CONDITIONS,
    exclusions: DEFAULT_EXCLUSIONS
  },
  {
    name: 'Béton - Commercial',
    description: 'Template pour travaux de béton en contexte commercial',
    projectType: 'commercial',
    category: 'Béton',
    defaultMargin: 12,
    validity: 30,
    paymentTerms: '30% début, 40% mi-projet, 30% fin',
    sections: [
      {
        id: 'prep',
        name: 'Préparation',
        items: [
          { id: '1', code: 'PREP-01', description: 'Mobilisation / Démobilisation', unit: 'forf.', quantity: 1, unitPrice: 0, total: 0, margin: 12 },
          { id: '2', code: 'PREP-02', description: 'Coffrages', unit: 'm²', quantity: 0, unitPrice: 0, total: 0, margin: 12 },
        ],
        subtotal: 0
      },
      {
        id: 'beton',
        name: 'Béton',
        items: [
          { id: '3', code: 'BET-01', description: 'Béton 30 MPa - Dalles', unit: 'm³', quantity: 0, unitPrice: 0, total: 0, margin: 12 },
          { id: '4', code: 'BET-02', description: 'Béton 30 MPa - Murs', unit: 'm³', quantity: 0, unitPrice: 0, total: 0, margin: 12 },
          { id: '5', code: 'ARM-01', description: 'Armature 15M', unit: 'kg', quantity: 0, unitPrice: 0, total: 0, margin: 12 },
        ],
        subtotal: 0
      }
    ],
    conditions: DEFAULT_CONDITIONS,
    exclusions: DEFAULT_EXCLUSIONS
  },
  {
    name: 'Institutionnel - Complet',
    description: 'Template complet pour projets institutionnels (écoles, hôpitaux)',
    projectType: 'institutional',
    category: 'Construction neuve',
    defaultMargin: 10,
    validity: 45,
    paymentTerms: 'Paiements progressifs selon avancement',
    sections: [
      {
        id: 'admin',
        name: 'Administration',
        items: [
          { id: '1', code: 'ADM-01', description: 'Gestion de projet', unit: '%', quantity: 5, unitPrice: 0, total: 0, margin: 10 },
          { id: '2', code: 'ADM-02', description: 'Assurances chantier', unit: 'forf.', quantity: 1, unitPrice: 0, total: 0, margin: 10 },
          { id: '3', code: 'ADM-03', description: 'Cautionnement', unit: 'forf.', quantity: 1, unitPrice: 0, total: 0, margin: 10 },
        ],
        subtotal: 0
      },
      {
        id: 'struct',
        name: 'Structure',
        items: [
          { id: '4', code: 'STR-01', description: 'Fondations', unit: 'forf.', quantity: 1, unitPrice: 0, total: 0, margin: 10 },
          { id: '5', code: 'STR-02', description: 'Structure béton', unit: 'forf.', quantity: 1, unitPrice: 0, total: 0, margin: 10 },
          { id: '6', code: 'STR-03', description: 'Charpente', unit: 'forf.', quantity: 1, unitPrice: 0, total: 0, margin: 10 },
        ],
        subtotal: 0
      }
    ],
    conditions: [
      ...DEFAULT_CONDITIONS,
      'Respect du calendrier des travaux fourni par le client',
      'Coordination avec les autres corps de métier',
      'Réunions de chantier hebdomadaires incluses'
    ],
    exclusions: [
      ...DEFAULT_EXCLUSIONS,
      'Mobilier et équipements spécialisés',
      'Systèmes informatiques et téléphonie'
    ]
  }
]

export default function SoumissionTemplates() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<SoumissionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'templates' | 'analytics'>('templates')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SoumissionTemplate | null>(null)
  const [marginAnalysis, setMarginAnalysis] = useState<MarginAnalysis[]>([])

  useEffect(() => {
    loadTemplates()
    loadMarginAnalysis()
  }, [])

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('soumission_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })

      if (data && data.length > 0) {
        setTemplates(data.map(t => ({
          ...t,
          sections: t.sections || [],
          conditions: t.conditions || DEFAULT_CONDITIONS,
          exclusions: t.exclusions || DEFAULT_EXCLUSIONS
        })))
      } else {
        // Créer templates par défaut
        setTemplates(DEFAULT_TEMPLATES.map((t, i) => ({
          ...t,
          id: `default-${i}`,
          isDefault: true,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })) as SoumissionTemplate[])
      }
    } catch (err) {
      console.error('Erreur chargement templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMarginAnalysis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les soumissions pour analyse
      const { data: soumissions } = await supabase
        .from('soumissions')
        .select('*')
        .eq('user_id', user.id)

      if (soumissions && soumissions.length > 0) {
        // Grouper par type de projet
        const analysisByType = PROJECT_TYPES.map(type => {
          const typeSoumissions = soumissions.filter(s => s.project_type === type.id)
          const wonSoumissions = typeSoumissions.filter(s => s.status === 'acceptee')
          
          const margins = typeSoumissions
            .filter(s => s.margin)
            .map(s => s.margin)
          
          const avgMargin = margins.length > 0 
            ? margins.reduce((a, b) => a + b, 0) / margins.length 
            : getDefaultMargin(type.id)
          
          return {
            projectType: type.name,
            avgMargin,
            minMargin: margins.length > 0 ? Math.min(...margins) : avgMargin - 5,
            maxMargin: margins.length > 0 ? Math.max(...margins) : avgMargin + 5,
            successRate: typeSoumissions.length > 0 
              ? (wonSoumissions.length / typeSoumissions.length) * 100 
              : 0,
            totalBids: typeSoumissions.length,
            wonBids: wonSoumissions.length,
            avgBidAmount: typeSoumissions.length > 0
              ? typeSoumissions.reduce((a, b) => a + (b.total || 0), 0) / typeSoumissions.length
              : 0,
            recommendation: getMarginRecommendation(type.id, avgMargin, wonSoumissions.length / Math.max(typeSoumissions.length, 1))
          }
        })

        setMarginAnalysis(analysisByType)
      } else {
        // Données par défaut
        setMarginAnalysis(PROJECT_TYPES.map(type => ({
          projectType: type.name,
          avgMargin: getDefaultMargin(type.id),
          minMargin: getDefaultMargin(type.id) - 3,
          maxMargin: getDefaultMargin(type.id) + 5,
          successRate: 35,
          totalBids: 0,
          wonBids: 0,
          avgBidAmount: 0,
          recommendation: 'Pas assez de données. Marge standard recommandée.'
        })))
      }
    } catch (err) {
      console.error('Erreur analyse marges:', err)
    }
  }

  const getDefaultMargin = (projectType: string): number => {
    switch (projectType) {
      case 'residential': return 15
      case 'commercial': return 12
      case 'institutional': return 10
      case 'industrial': return 8
      default: return 12
    }
  }

  const getMarginRecommendation = (projectType: string, avgMargin: number, successRate: number): string => {
    if (successRate > 0.5) {
      return `Excellent taux de succès! Vous pourriez augmenter vos marges de 2-3%.`
    } else if (successRate > 0.3) {
      return `Bon équilibre. Maintenez vos marges actuelles.`
    } else if (successRate > 0.15) {
      return `Taux de succès faible. Considérez réduire vos marges de 1-2%.`
    } else {
      return `Analysez vos prix par rapport au marché.`
    }
  }

  const handleDuplicateTemplate = (template: SoumissionTemplate) => {
    const newTemplate: SoumissionTemplate = {
      ...template,
      id: `copy-${Date.now()}`,
      name: `${template.name} (copie)`,
      isDefault: false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setTemplates([newTemplate, ...templates])
    setEditingTemplate(newTemplate)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Supprimer ce template?')) return
    
    setTemplates(templates.filter(t => t.id !== templateId))
    
    if (!templateId.startsWith('default-') && !templateId.startsWith('copy-')) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('soumission_templates')
          .delete()
          .eq('id', templateId)
          .eq('user_id', user.id)
      }
    }
  }

  const handleUseTemplate = (template: SoumissionTemplate) => {
    // Naviguer vers le builder avec le template
    navigate('/soumission/new', { state: { template } })
  }

  const filteredTemplates = templates.filter(t => {
    if (filterType !== 'all' && t.projectType !== filterType) return false
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getProjectTypeConfig = (type: string) => {
    return PROJECT_TYPES.find(t => t.id === type) || PROJECT_TYPES[0]
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="text-teal-600" />
            Templates de Soumission
          </h1>
          <p className="text-gray-500">Modèles personnalisés avec calcul de marge intelligent</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Nouveau template
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'templates' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <FileText size={18} />
          Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'analytics' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <TrendingUp size={18} />
          Analyse Rentabilité
        </button>
      </div>

      {/* Tab: Templates */}
      {activeTab === 'templates' && (
        <>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  filterType === 'all' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              {PROJECT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition ${
                    filterType === type.id ? type.color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <type.icon size={14} />
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => {
              const typeConfig = getProjectTypeConfig(template.projectType)
              return (
                <div 
                  key={template.id}
                  className="bg-white rounded-xl border p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                        <typeConfig.icon size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <span className="text-xs text-gray-500">{template.category}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold text-gray-900">{template.defaultMargin}%</p>
                      <p className="text-xs text-gray-500">Marge</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold text-gray-900">{template.sections?.length || 0}</p>
                      <p className="text-xs text-gray-500">Sections</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold text-gray-900">{template.usageCount}</p>
                      <p className="text-xs text-gray-500">Utilisations</p>
                    </div>
                  </div>

                  {/* Suggested Margin */}
                  {template.suggestedMargin && template.suggestedMargin !== template.defaultMargin && (
                    <div className="mb-4 p-2 bg-blue-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Calculator size={14} />
                        <span>Marge suggérée: <strong>{template.suggestedMargin}%</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex items-center justify-center gap-1"
                    >
                      <FileText size={14} />
                      Utiliser
                    </button>
                    <button
                      onClick={() => handleDuplicateTemplate(template)}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                      title="Dupliquer"
                    >
                      <Copy size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                      title="Modifier"
                    >
                      <Edit2 size={16} className="text-gray-500" />
                    </button>
                    {!template.isDefault && (
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 border rounded-lg hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {filteredTemplates.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <FileText className="mx-auto mb-2 text-gray-300" size={48} />
                <p>Aucun template trouvé</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Percent className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {marginAnalysis.length > 0 
                      ? (marginAnalysis.reduce((a, b) => a + b.avgMargin, 0) / marginAnalysis.length).toFixed(1)
                      : 12}%
                  </p>
                  <p className="text-sm text-gray-500">Marge moyenne</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {marginAnalysis.length > 0 
                      ? (marginAnalysis.reduce((a, b) => a + b.successRate, 0) / marginAnalysis.length).toFixed(0)
                      : 35}%
                  </p>
                  <p className="text-sm text-gray-500">Taux de succès</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FileText className="text-amber-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {marginAnalysis.reduce((a, b) => a + b.totalBids, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Soumissions totales</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {marginAnalysis.reduce((a, b) => a + b.wonBids, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Contrats gagnés</p>
                </div>
              </div>
            </div>
          </div>

          {/* Margin Analysis by Project Type */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Analyse par type de projet</h3>
            
            <div className="space-y-4">
              {marginAnalysis.map((analysis, idx) => {
                const typeConfig = PROJECT_TYPES[idx] || PROJECT_TYPES[0]
                return (
                  <div key={analysis.projectType} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                          <typeConfig.icon size={18} />
                        </div>
                        <div>
                          <h4 className="font-medium">{analysis.projectType}</h4>
                          <p className="text-sm text-gray-500">
                            {analysis.totalBids} soumissions • {analysis.wonBids} gagnées
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{analysis.avgMargin.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">Marge moyenne</p>
                      </div>
                    </div>

                    {/* Margin Range Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Min: {analysis.minMargin.toFixed(1)}%</span>
                        <span>Max: {analysis.maxMargin.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full relative">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"
                          style={{
                            left: `${(analysis.minMargin / 25) * 100}%`,
                            width: `${((analysis.maxMargin - analysis.minMargin) / 25) * 100}%`
                          }}
                        />
                        <div 
                          className="absolute w-3 h-3 bg-teal-600 rounded-full -top-0.5 border-2 border-white shadow"
                          style={{ left: `${(analysis.avgMargin / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Success Rate */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Taux de succès</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              analysis.successRate >= 40 ? 'bg-green-500' :
                              analysis.successRate >= 25 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${analysis.successRate}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${
                          analysis.successRate >= 40 ? 'text-green-600' :
                          analysis.successRate >= 25 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {analysis.successRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="p-2 bg-blue-50 rounded text-sm text-blue-700 flex items-start gap-2">
                      <Info size={14} className="mt-0.5 flex-shrink-0" />
                      {analysis.recommendation}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Margin Calculator */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator className="text-teal-600" />
              Calculateur de marge
            </h3>
            <MarginCalculator marginAnalysis={marginAnalysis} />
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <TemplateEditorModal
          template={editingTemplate}
          onSave={(updated) => {
            setTemplates(templates.map(t => t.id === updated.id ? updated : t))
            setEditingTemplate(null)
          }}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  )
}

// Calculateur de marge intégré
function MarginCalculator({ marginAnalysis }: { marginAnalysis: MarginAnalysis[] }) {
  const [projectType, setProjectType] = useState('commercial')
  const [cost, setCost] = useState(100000)
  const [targetMargin, setTargetMargin] = useState(12)

  const analysis = marginAnalysis.find(a => 
    a.projectType.toLowerCase().includes(projectType) ||
    projectType.includes(a.projectType.toLowerCase())
  ) || marginAnalysis[0]

  const sellingPrice = cost / (1 - targetMargin / 100)
  const profit = sellingPrice - cost
  
  const suggestedMargin = analysis?.avgMargin || 12
  const suggestedPrice = cost / (1 - suggestedMargin / 100)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type de projet</label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {PROJECT_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Coût estimé ($)</label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Marge souhaitée (%)</label>
          <input
            type="range"
            min="5"
            max="30"
            value={targetMargin}
            onChange={(e) => setTargetMargin(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>5%</span>
            <span className="font-medium text-teal-600">{targetMargin}%</span>
            <span>30%</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-teal-50 rounded-lg">
          <p className="text-sm text-teal-700 mb-1">Prix de vente suggéré</p>
          <p className="text-3xl font-bold text-teal-700">
            {sellingPrice.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-teal-600">
            Profit: {profit.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </p>
        </div>

        {analysis && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-1">
              Basé sur votre historique ({analysis.projectType})
            </p>
            <p className="text-sm">
              Marge moyenne: <strong>{suggestedMargin.toFixed(1)}%</strong>
            </p>
            <p className="text-sm">
              Prix suggéré: <strong>{suggestedPrice.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Modal d'édition de template
function TemplateEditorModal({ 
  template, 
  onSave, 
  onClose 
}: { 
  template: SoumissionTemplate
  onSave: (template: SoumissionTemplate) => void
  onClose: () => void 
}) {
  const [editedTemplate, setEditedTemplate] = useState(template)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const handleSave = () => {
    onSave({
      ...editedTemplate,
      updatedAt: new Date().toISOString()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Modifier le template</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom du template *</label>
              <input
                type="text"
                value={editedTemplate.name}
                onChange={(e) => setEditedTemplate({...editedTemplate, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type de projet</label>
              <select
                value={editedTemplate.projectType}
                onChange={(e) => setEditedTemplate({...editedTemplate, projectType: e.target.value as any})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {PROJECT_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <select
                value={editedTemplate.category}
                onChange={(e) => setEditedTemplate({...editedTemplate, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Marge par défaut (%)</label>
              <input
                type="number"
                value={editedTemplate.defaultMargin}
                onChange={(e) => setEditedTemplate({...editedTemplate, defaultMargin: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                max="50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={editedTemplate.description}
              onChange={(e) => setEditedTemplate({...editedTemplate, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Sections</label>
              <button
                onClick={() => {
                  const newSection: TemplateSection = {
                    id: `sec-${Date.now()}`,
                    name: 'Nouvelle section',
                    items: [],
                    subtotal: 0
                  }
                  setEditedTemplate({
                    ...editedTemplate,
                    sections: [...(editedTemplate.sections || []), newSection]
                  })
                }}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                + Ajouter section
              </button>
            </div>
            
            <div className="space-y-2">
              {(editedTemplate.sections || []).map((section, idx) => (
                <div key={section.id} className="border rounded-lg">
                  <button
                    onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <span className="font-medium">{section.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{section.items?.length || 0} items</span>
                      {activeSection === section.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>
                  
                  {activeSection === section.id && (
                    <div className="p-4 border-t bg-gray-50">
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => {
                          const newSections = [...(editedTemplate.sections || [])]
                          newSections[idx].name = e.target.value
                          setEditedTemplate({...editedTemplate, sections: newSections})
                        }}
                        className="w-full px-3 py-2 border rounded-lg mb-2"
                        placeholder="Nom de la section"
                      />
                      <p className="text-xs text-gray-500">
                        {section.items?.length || 0} items dans cette section
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium mb-2">Conditions</label>
            <textarea
              value={(editedTemplate.conditions || []).join('\n')}
              onChange={(e) => setEditedTemplate({
                ...editedTemplate, 
                conditions: e.target.value.split('\n').filter(c => c.trim())
              })}
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              rows={5}
              placeholder="Une condition par ligne..."
            />
          </div>

          {/* Exclusions */}
          <div>
            <label className="block text-sm font-medium mb-2">Exclusions</label>
            <textarea
              value={(editedTemplate.exclusions || []).join('\n')}
              onChange={(e) => setEditedTemplate({
                ...editedTemplate, 
                exclusions: e.target.value.split('\n').filter(c => c.trim())
              })}
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              rows={4}
              placeholder="Une exclusion par ligne..."
            />
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
          >
            <Save size={16} />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
