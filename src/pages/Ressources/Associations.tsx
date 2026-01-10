/**
 * DAST Solutions - Associations professionnelles COMPLÈTES
 * Toutes les associations de construction du Québec/Canada
 * Mis à jour: 9 janvier 2026
 */
import { useState } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { ExternalLink, Users, Phone, Globe, Search, Filter, Building2, Award } from 'lucide-react'

interface Association {
  id: string
  name: string
  acronym: string
  description: string
  url: string
  logo: string
  phone?: string
  members?: string
  category: 'ordre' | 'association' | 'gouvernement' | 'syndicat' | 'autre'
}

const ASSOCIATIONS: Association[] = [
  // === ORDRES PROFESSIONNELS ===
  { id: 'oiq', acronym: 'OIQ', name: 'Ordre des ingénieurs du Québec', description: 'Encadre la pratique du génie au Québec', url: 'https://www.oiq.qc.ca', logo: '📐', phone: '514-845-6141', members: '70 000+', category: 'ordre' },
  { id: 'oaq', acronym: 'OAQ', name: 'Ordre des architectes du Québec', description: 'Protège le public en matière d\'architecture', url: 'https://www.oaq.com', logo: '🏛️', phone: '514-937-6168', members: '4 500+', category: 'ordre' },
  { id: 'otp', acronym: 'OTP', name: 'Ordre des technologues professionnels', description: 'Regroupe les technologues professionnels du Québec', url: 'https://www.otpq.qc.ca', logo: '🔬', phone: '514-845-3247', members: '8 000+', category: 'ordre' },
  
  // === ORGANISMES GOUVERNEMENTAUX ===
  { id: 'ccq', acronym: 'CCQ', name: 'Commission de la construction du Québec', description: 'Administre les régimes de relations de travail de l\'industrie', url: 'https://www.ccq.org', logo: '⚙️', phone: '1-888-842-8282', members: '190 000+', category: 'gouvernement' },
  { id: 'rbq', acronym: 'RBQ', name: 'Régie du bâtiment du Québec', description: 'Assure la qualité des travaux de construction et la sécurité', url: 'https://www.rbq.gouv.qc.ca', logo: '🔒', phone: '1-800-361-0761', members: '45 000+', category: 'gouvernement' },
  
  // === ASSOCIATIONS PATRONALES MAJEURES ===
  { id: 'acq', acronym: 'ACQ', name: 'Association de la construction du Québec', description: 'Représente les entrepreneurs généraux et spécialisés du Québec', url: 'https://www.acq.org', logo: '🏗️', phone: '514-354-0609', members: '17 000+', category: 'association' },
  { id: 'apchq', acronym: 'APCHQ', name: 'Association des professionnels de la construction et de l\'habitation du Québec', description: 'Regroupe les entrepreneurs en construction résidentielle', url: 'https://www.apchq.com', logo: '🏠', phone: '514-353-9960', members: '19 000+', category: 'association' },
  { id: 'aecq', acronym: 'AECQ', name: 'Association des entrepreneurs en construction du Québec', description: 'Association patronale du secteur institutionnel et commercial', url: 'https://www.aecq.org', logo: '🏢', phone: '514-354-8249', category: 'association' },
  { id: 'apecq', acronym: 'APECQ', name: 'Association patronale des entreprises en construction du Québec', description: 'Représente les entrepreneurs du secteur génie civil et voirie', url: 'https://www.apecq.org', logo: '🛤️', phone: '514-739-2381', category: 'association' },
  { id: 'cegq', acronym: 'CEGQ', name: 'Corporation des entrepreneurs généraux du Québec', description: 'Regroupe les entrepreneurs généraux du Québec', url: 'https://www.cegq.com', logo: '🏗️', phone: '514-393-7934', members: '400+', category: 'association' },
  
  // === ASSOCIATIONS ESTIMATEURS ===
  { id: 'aeecq', acronym: 'AEÉCQ', name: 'Association des estimateurs et économistes en construction du Québec', description: 'Regroupe les estimateurs professionnels', url: 'https://www.aeecq.org', logo: '📊', phone: '514-990-3322', members: '500+', category: 'association' },
  { id: 'ciqs', acronym: 'CIQS/ICÉC', name: 'Canadian Institute of Quantity Surveyors / Institut canadien des économistes en construction', description: 'Certification Gold Seal et reconnaissance professionnelle', url: 'https://www.ciqs.org', logo: '🏅', phone: '905-471-0882', members: '2 000+', category: 'association' },
  
  // === ASSOCIATIONS CORPS DE MÉTIERS ===
  { id: 'cmeq', acronym: 'CMEQ', name: 'Corporation des maîtres électriciens du Québec', description: 'Représente les entrepreneurs électriciens', url: 'https://www.cmeq.org', logo: '⚡', phone: '514-738-2184', members: '3 500+', category: 'association' },
  { id: 'cmmtq', acronym: 'CMMTQ', name: 'Corporation des maîtres mécaniciens en tuyauterie du Québec', description: 'Représente les entrepreneurs en plomberie et chauffage', url: 'https://www.cmmtq.org', logo: '🔧', phone: '514-382-2668', members: '2 800+', category: 'association' },
  { id: 'aemq', acronym: 'AEMQ', name: 'Association des entrepreneurs en maçonnerie du Québec', description: 'Regroupe les entrepreneurs spécialisés en maçonnerie', url: 'https://www.aemq.com', logo: '🧱', phone: '514-489-8080', members: '200+', category: 'association' },
  { id: 'amcq', acronym: 'AMCQ', name: 'Association de la maîtrise en couverture du Québec', description: 'Représente les couvreurs professionnels', url: 'https://www.amcq.qc.ca', logo: '🏚️', phone: '514-387-7474', members: '300+', category: 'association' },
  { id: 'aiq', acronym: 'AIQ', name: 'Association d\'isolation du Québec', description: 'Regroupe les entrepreneurs en isolation', url: 'https://www.isolationquebec.com', logo: '🧊', phone: '514-990-3361', members: '150+', category: 'association' },
  { id: 'aibq', acronym: 'AIBQ', name: 'Association des industries du bois du Québec', description: 'Représente l\'industrie du bois et menuiserie', url: 'https://www.aibq.qc.ca', logo: '🪵', phone: '418-872-5610', category: 'association' },
  { id: 'afdicq', acronym: 'AFDICQ', name: 'Association des fabricants et distributeurs de l\'industrie de la cuisine du Québec', description: 'Industrie des armoires et cuisines', url: 'https://www.afdicq.ca', logo: '🍽️', phone: '450-646-5859', category: 'association' },
  { id: 'awmac', acronym: 'AWMAC', name: 'Architectural Woodwork Manufacturers Association of Canada', description: 'Boiseries architecturales et ébénisterie', url: 'https://www.awmac.com', logo: '🪑', phone: '613-238-3888', category: 'association' },
  { id: 'apesiq', acronym: 'APESIQ', name: 'Association provinciale des entrepreneurs en systèmes intérieurs du Québec', description: 'Systèmes intérieurs, cloisons, plafonds', url: 'https://www.apesiq.org', logo: '🚪', phone: '514-990-3361', category: 'association' },
  { id: 'apdiq', acronym: 'APDIQ', name: 'Association des professionnels du design intérieur du Québec', description: 'Design intérieur et aménagement', url: 'https://www.apdiq.com', logo: '🎨', phone: '514-284-6263', category: 'association' },
  { id: 'avfq', acronym: 'AVFQ', name: 'Association des vitreries et fenestrations du Québec', description: 'Vitriers et fenestration', url: 'https://www.avfq.org', logo: '🪟', phone: '514-990-3361', category: 'association' },
  
  // === ASSOCIATIONS GÉNIE CIVIL ===
  { id: 'acrgtq', acronym: 'ACRGTQ', name: 'Association des constructeurs de routes et grands travaux du Québec', description: 'Entrepreneurs en génie civil, routes et grands travaux', url: 'https://www.acrgtq.qc.ca', logo: '🛣️', phone: '418-529-2949', members: '800+', category: 'association' },
  { id: 'aermq', acronym: 'AERMQ', name: 'Association des entrepreneurs en revêtement métallique du Québec', description: 'Revêtement métallique et toiture', url: 'https://www.aermq.com', logo: '🔩', phone: '450-973-2555', category: 'association' },
  
  // === ASSOCIATIONS SPÉCIALISÉES ===
  { id: 'bsdq', acronym: 'BSDQ', name: 'Bureau des soumissions déposées du Québec', description: 'Gestion des soumissions et dépôt de prix', url: 'https://www.bsdq.org', logo: '📋', phone: '514-866-8826', category: 'association' },
  { id: 'batimatech', acronym: 'Batimatech', name: 'Batimatech - Innovation construction', description: 'Innovation et technologies dans la construction', url: 'https://www.batimatech.com', logo: '💡', phone: '514-355-0002', category: 'association' },
  { id: 'fqaesc', acronym: 'FQAESC', name: 'Fédération québécoise des associations d\'entrepreneurs spécialisés en construction', description: 'Fédération des associations spécialisées', url: 'https://www.fqaesc.qc.ca', logo: '🤝', phone: '514-990-3361', category: 'association' },
  { id: 'recq', acronym: 'RECQ', name: 'Regroupement des entrepreneurs en coffrage du Québec', description: 'Entrepreneurs en coffrage béton', url: 'https://www.recq.org', logo: '🧱', phone: '514-990-3361', category: 'association' },
  { id: 'cetaf', acronym: 'CETAF', name: 'Corporation des entreprises de traitement de l\'air et du froid', description: 'CVAC, réfrigération, traitement de l\'air', url: 'https://www.cetaf.qc.ca', logo: '❄️', phone: '514-735-1131', members: '600+', category: 'association' },
  { id: 'aecsq', acronym: 'AECSQ', name: 'Association des entrepreneurs en construction spécialisée du Québec', description: 'Entrepreneurs en construction spécialisée', url: 'https://www.aecsq.org', logo: '🔨', phone: '514-990-3361', category: 'association' },
  { id: 'aqmat', acronym: 'AQMAT', name: 'Association québécoise de la quincaillerie et des matériaux de construction', description: 'Distributeurs et détaillants de matériaux', url: 'https://www.aqmat.org', logo: '🏪', phone: '514-905-1484', members: '1 200+', category: 'association' },
  { id: 'oeaq', acronym: 'OÉAQ', name: 'Ordre des évaluateurs agréés du Québec', description: 'Évaluateurs immobiliers professionnels', url: 'https://www.oeaq.qc.ca', logo: '💰', phone: '514-281-9888', members: '1 800+', category: 'ordre' },
  { id: 'aappq', acronym: 'AAPPQ', name: 'Association des architectes paysagistes du Québec', description: 'Architectes paysagistes professionnels', url: 'https://www.aappq.org', logo: '🌳', phone: '514-990-7731', members: '600+', category: 'association' },
  
  // === SYNDICATS ===
  { id: 'ftq', acronym: 'FTQ-Construction', name: 'FTQ-Construction', description: 'Syndicat des travailleurs de la construction - FTQ', url: 'https://www.ftqconstruction.org', logo: '👷', phone: '514-381-5765', members: '90 000+', category: 'syndicat' },
  { id: 'cpqmci', acronym: 'CPQMCI', name: 'Conseil provincial du Québec des métiers de la construction - International', description: 'Syndicat international de la construction', url: 'https://www.cpqmci.org', logo: '👷', phone: '514-842-3916', members: '30 000+', category: 'syndicat' },
  { id: 'csd', acronym: 'CSD Construction', name: 'CSD Construction', description: 'Centrale des syndicats démocratiques - Construction', url: 'https://www.csd.qc.ca', logo: '👷', phone: '514-899-1070', members: '15 000+', category: 'syndicat' },
  { id: 'snc', acronym: 'SNC', name: 'Syndicat national de la construction', description: 'Syndicat de la CSN pour la construction', url: 'https://snc-csn.org', logo: '👷', phone: '514-598-2271', members: '12 000+', category: 'syndicat' },
]

const CATEGORIES = [
  { id: 'all', name: 'Toutes', icon: '📁' },
  { id: 'ordre', name: 'Ordres professionnels', icon: '⚖️' },
  { id: 'gouvernement', name: 'Gouvernement', icon: '🏛️' },
  { id: 'association', name: 'Associations', icon: '🤝' },
  { id: 'syndicat', name: 'Syndicats', icon: '👷' },
]

export default function Associations() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filteredAssociations = ASSOCIATIONS.filter(assoc => {
    const matchesSearch = 
      assoc.name.toLowerCase().includes(search.toLowerCase()) ||
      assoc.acronym.toLowerCase().includes(search.toLowerCase()) ||
      assoc.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || assoc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ordre': return 'bg-purple-100 text-purple-700'
      case 'gouvernement': return 'bg-blue-100 text-blue-700'
      case 'association': return 'bg-green-100 text-green-700'
      case 'syndicat': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <PageTitle title="Associations professionnelles" />
        <p className="text-gray-500 mt-1">
          {ASSOCIATIONS.length} organismes et associations de l'industrie de la construction au Québec
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une association..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Catégories */}
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
          const count = ASSOCIATIONS.filter(a => a.category === cat.id).length
          return (
            <div key={cat.id} className="bg-white rounded-lg border p-4 text-center">
              <div className="text-2xl mb-1">{cat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-500">{cat.name}</div>
            </div>
          )
        })}
      </div>

      {/* Liste */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssociations.map(assoc => (
          <div 
            key={assoc.id} 
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition group"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{assoc.logo}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-teal-600">{assoc.acronym}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(assoc.category)}`}>
                    {assoc.category === 'ordre' ? 'Ordre' : 
                     assoc.category === 'gouvernement' ? 'Gouv.' :
                     assoc.category === 'syndicat' ? 'Syndicat' : 'Assoc.'}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{assoc.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{assoc.description}</p>
                
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                  {assoc.members && (
                    <span className="flex items-center gap-1">
                      <Users size={12} />{assoc.members}
                    </span>
                  )}
                  {assoc.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} />{assoc.phone}
                    </span>
                  )}
                </div>
                
                <a 
                  href={assoc.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-xs font-medium transition"
                >
                  <Globe size={14} />
                  Visiter
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAssociations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucune association trouvée</p>
        </div>
      )}
    </div>
  )
}
