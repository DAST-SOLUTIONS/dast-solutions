/**
 * DAST Solutions - Documents ACC/CCDC
 * Contrats types de construction - Liens directs officiels
 * Mis à jour: 9 janvier 2026
 */
import { useState } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { 
  FileText, ExternalLink, Info, DollarSign, Building2, 
  Search, BookOpen, Scale, Shield, FileCheck
} from 'lucide-react'

interface ContractDocument {
  id: string
  code: string
  name: string
  nameFr?: string
  description: string
  category: 'ccdc' | 'cca' | 'ccaq' | 'guide'
  url: string
  price: string
  usage: string[]
  updated?: string
}

const DOCUMENTS: ContractDocument[] = [
  // === CCDC - Contrats de construction ===
  {
    id: 'ccdc2',
    code: 'CCDC 2',
    name: 'Stipulated Price Contract',
    nameFr: 'Contrat à forfait',
    description: 'Le contrat standard de l\'industrie pour les projets à prix fixe. Le plus utilisé au Canada.',
    category: 'ccdc',
    url: 'https://www.ccdc.org/document/ccdc-2/',
    price: '~45$',
    usage: ['Commercial', 'Institutionnel', 'Résidentiel multi'],
    updated: '2020'
  },
  {
    id: 'ccdc3',
    code: 'CCDC 3',
    name: 'Cost Plus Contract',
    nameFr: 'Contrat à coût majoré',
    description: 'Contrat à coût remboursable avec honoraires fixes ou pourcentage.',
    category: 'ccdc',
    url: 'https://www.ccdc.org/document/ccdc-3/',
    price: '~45$',
    usage: ['Projets urgents', 'Scope indéfini', 'Rénovations complexes'],
    updated: '2016'
  },
  {
    id: 'ccdc4',
    code: 'CCDC 4',
    name: 'Unit Price Contract',
    nameFr: 'Contrat à prix unitaires',
    description: 'Contrat basé sur des quantités estimées et prix unitaires convenus.',
    category: 'ccdc',
    url: 'https://www.ccdc.org/document/ccdc-4/',
    price: '~45$',
    usage: ['Génie civil', 'Travaux routiers', 'Excavation'],
    updated: '2011'
  },
  {
    id: 'ccdc5a',
    code: 'CCDC 5A',
    name: 'Construction Management Contract - For Services',
    nameFr: 'Contrat de gestion de construction - Services',
    description: 'Le gérant de construction agit comme agent du propriétaire.',
    category: 'ccdc',
    url: 'https://www.ccdc.org/document/ccdc-5a/',
    price: '~45$',
    usage: ['Grands projets', 'Projets complexes', 'Multi-phases'],
    updated: '2010'
  },
  {
    id: 'ccdc5b',
    code: 'CCDC 5B',
    name: 'Construction Management Contract - For Services and Construction',
    nameFr: 'Contrat de gestion de construction - Services et construction',
    description: 'Le gérant assume aussi la responsabilité de l\'exécution des travaux.',
    category: 'ccdc',
    url: 'https://www.ccdc.org/document/ccdc-5b/',
    price: '~45$',
    usage: ['Institutionnel majeur', 'Projets publics', 'PPP'],
    updated: '2010'
  },
  {
    id: 'ccdc14',
    code: 'CCDC 14',
    name: 'Design-Build Stipulated Price Contract',
    nameFr: 'Contrat conception-construction à forfait',
    description: 'Intègre la conception et la construction sous un seul contrat.',
    category: 'ccdc',
    url: 'https://www.ccdc.org/document/ccdc-14/',
    price: '~45$',
    usage: ['Clé en main', 'Industrial', 'Entrepôts'],
    updated: '2013'
  },
  {
    id: 'ccdc17',
    code: 'CCDC 17',
    name: 'Stipulated Price Contract for Trade Contractors',
    nameFr: 'Contrat à forfait pour sous-traitants',
    description: 'Version du CCDC 2 adaptée pour les contrats avec sous-traitants.',
    category: 'ccdc',
    url: 'https://www.ccdc.org/document/ccdc-17/',
    price: '~45$',
    usage: ['Sous-traitance', 'Métiers spécialisés'],
    updated: '2020'
  },
  
  // === CCA - Documents complémentaires ===
  {
    id: 'cca1',
    code: 'CCA 1',
    name: 'Guide to Construction Project Document Protocols',
    nameFr: 'Guide des protocoles de documents de projet',
    description: 'Guide pour la gestion documentaire des projets de construction.',
    category: 'cca',
    url: 'https://www.cca-acc.com/resources/documents/',
    price: 'Gratuit',
    usage: ['Tous projets', 'Gestion documentaire'],
    updated: '2021'
  },
  
  // === CCAQ - Documents québécois ===
  {
    id: 'ccq1',
    code: 'CCQ-1',
    name: 'Conditions générales - Contrats publics',
    nameFr: 'Conditions générales pour contrats publics',
    description: 'Conditions générales pour les contrats de construction publics au Québec.',
    category: 'ccaq',
    url: 'https://www.tresor.gouv.qc.ca/faire-affaire-avec-letat/les-marches-publics/conditions-des-contrats-de-construction/',
    price: 'Gratuit',
    usage: ['Projets publics QC', 'Municipalités', 'Gouvernement'],
    updated: '2023'
  },
  {
    id: 'ccq2',
    code: 'CCAQ-2',
    name: 'Clauses administratives générales',
    nameFr: 'Clauses administratives générales',
    description: 'Clauses administratives pour contrats publics québécois.',
    category: 'ccaq',
    url: 'https://www.tresor.gouv.qc.ca/fileadmin/PDF/faire_affaire_avec_etat/marches_publics/conditions_contrats/clauses_admin_gen.pdf',
    price: 'Gratuit',
    usage: ['Contrats SEAO', 'Infrastructure QC'],
    updated: '2022'
  },
  
  // === Guides et ressources ===
  {
    id: 'guide-ccdc',
    code: 'Guide CCDC',
    name: 'A Guide to CCDC Construction Contracts',
    nameFr: 'Guide des contrats CCDC',
    description: 'Guide complet pour comprendre et utiliser les contrats CCDC.',
    category: 'guide',
    url: 'https://www.ccdc.org/resources/',
    price: '~75$',
    usage: ['Formation', 'Référence'],
    updated: '2021'
  },
  {
    id: 'guide-acc',
    code: 'Guide ACC',
    name: 'Construction Contracts Best Practices',
    nameFr: 'Meilleures pratiques contractuelles',
    description: 'Guide de l\'ACC sur les meilleures pratiques en gestion contractuelle.',
    category: 'guide',
    url: 'https://www.cca-acc.com/resources/',
    price: 'Gratuit',
    usage: ['Formation', 'Gestion de projet'],
    updated: '2022'
  },
]

const CATEGORIES = [
  { id: 'all', name: 'Tous', icon: '📁', color: 'bg-gray-100 text-gray-700' },
  { id: 'ccdc', name: 'CCDC', icon: '📄', color: 'bg-blue-100 text-blue-700' },
  { id: 'cca', name: 'CCA/ACC', icon: '📋', color: 'bg-green-100 text-green-700' },
  { id: 'ccaq', name: 'Québec', icon: '⚜️', color: 'bg-purple-100 text-purple-700' },
  { id: 'guide', name: 'Guides', icon: '📚', color: 'bg-orange-100 text-orange-700' },
]

export default function DocumentsACCCCDC() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filteredDocs = DOCUMENTS.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.code.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase()) ||
      (doc.nameFr && doc.nameFr.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryStyle = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category)
    return cat?.color || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <PageTitle title="Contrats ACC / CCDC" />
        <p className="text-gray-500 mt-1">
          Documents contractuels standards de l'industrie de la construction canadienne
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-800 font-medium mb-1">Documents officiels</p>
          <p className="text-blue-700">
            Les documents CCDC sont publiés conjointement par l'
            <a href="https://www.cca-acc.com" target="_blank" rel="noopener" className="underline font-medium">Association canadienne de la construction (ACC)</a>
            {' '}et le{' '}
            <a href="https://www.ccdc.org" target="_blank" rel="noopener" className="underline font-medium">Comité canadien des documents de construction (CCDC)</a>.
            {' '}Les documents québécois sont disponibles via le{' '}
            <a href="https://www.tresor.gouv.qc.ca" target="_blank" rel="noopener" className="underline font-medium">Secrétariat du Conseil du trésor</a>.
          </p>
        </div>
      </div>

      {/* Liens rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <a 
          href="https://www.ccdc.org/documents/" 
          target="_blank" 
          rel="noopener"
          className="bg-white border rounded-xl p-4 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">CCDC.org</p>
            <p className="text-xs text-gray-500">Tous les documents</p>
          </div>
          <ExternalLink size={14} className="text-gray-400 ml-auto" />
        </a>
        <a 
          href="https://www.cca-acc.com" 
          target="_blank" 
          rel="noopener"
          className="bg-white border rounded-xl p-4 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="p-2 bg-green-100 rounded-lg">
            <Building2 size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">ACC / CCA</p>
            <p className="text-xs text-gray-500">Ressources</p>
          </div>
          <ExternalLink size={14} className="text-gray-400 ml-auto" />
        </a>
        <a 
          href="https://www.tresor.gouv.qc.ca/faire-affaire-avec-letat/les-marches-publics/" 
          target="_blank" 
          rel="noopener"
          className="bg-white border rounded-xl p-4 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="p-2 bg-purple-100 rounded-lg">
            <Scale size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Trésor QC</p>
            <p className="text-xs text-gray-500">Marchés publics</p>
          </div>
          <ExternalLink size={14} className="text-gray-400 ml-auto" />
        </a>
        <a 
          href="https://www.acq.org/services/juridique/contrats-types" 
          target="_blank" 
          rel="noopener"
          className="bg-white border rounded-xl p-4 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="p-2 bg-teal-100 rounded-lg">
            <FileCheck size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">ACQ</p>
            <p className="text-xs text-gray-500">Contrats types</p>
          </div>
          <ExternalLink size={14} className="text-gray-400 ml-auto" />
        </a>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  categoryFilter === cat.id 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des documents */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredDocs.map(doc => (
          <div 
            key={doc.id} 
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-100 rounded-lg flex-shrink-0">
                <FileText size={24} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-teal-600">{doc.code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryStyle(doc.category)}`}>
                    {doc.category.toUpperCase()}
                  </span>
                  {doc.updated && (
                    <span className="text-xs text-gray-400">v{doc.updated}</span>
                  )}
                </div>
                
                <h3 className="font-medium text-gray-900 text-sm">{doc.nameFr || doc.name}</h3>
                <p className="text-xs text-gray-500 italic mb-2">{doc.nameFr ? doc.name : ''}</p>
                <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {doc.usage.map((use, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {use}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <DollarSign size={14} />
                    {doc.price}
                  </span>
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition"
                  >
                    Accéder
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun document trouvé</p>
        </div>
      )}
    </div>
  )
}
