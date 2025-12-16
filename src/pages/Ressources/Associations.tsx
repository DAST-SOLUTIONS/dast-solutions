/**
 * DAST Solutions - Associations professionnelles
 * Liens vers les associations de construction du Québec
 */
import { PageTitle } from '@/components/PageTitle'
import { ExternalLink, Building, Users, Award, BookOpen, Phone, Mail, Globe, MapPin } from 'lucide-react'

const ASSOCIATIONS = [
  { id: '1', name: 'ACQ - Association de la construction du Québec', description: 'Représente les entrepreneurs généraux et spécialisés du Québec', url: 'https://www.acq.org', logo: '🏗️', phone: '514-354-0609', members: '17 000+' },
  { id: '2', name: 'APCHQ - Association des professionnels de la construction et de l\'habitation du Québec', description: 'Regroupe les entrepreneurs en construction résidentielle', url: 'https://www.apchq.com', logo: '🏠', phone: '514-353-9960', members: '19 000+' },
  { id: '3', name: 'CCQ - Commission de la construction du Québec', description: 'Administre les régimes de relations de travail de l\'industrie', url: 'https://www.ccq.org', logo: '⚙️', phone: '1-888-842-8282', members: '190 000+' },
  { id: '4', name: 'RBQ - Régie du bâtiment du Québec', description: 'Assure la qualité des travaux de construction et la sécurité', url: 'https://www.rbq.gouv.qc.ca', logo: '🔒', phone: '1-800-361-0761', members: '45 000+' },
  { id: '5', name: 'CMEQ - Corporation des maîtres électriciens du Québec', description: 'Représente les entrepreneurs électriciens', url: 'https://www.cmeq.org', logo: '⚡', phone: '514-738-2184', members: '3 500+' },
  { id: '6', name: 'CMMTQ - Corporation des maîtres mécaniciens en tuyauterie du Québec', description: 'Représente les entrepreneurs en plomberie et chauffage', url: 'https://www.cmmtq.org', logo: '🔧', phone: '514-382-2668', members: '2 800+' },
  { id: '7', name: 'OIQ - Ordre des ingénieurs du Québec', description: 'Encadre la pratique du génie au Québec', url: 'https://www.oiq.qc.ca', logo: '📐', phone: '514-845-6141', members: '70 000+' },
  { id: '8', name: 'OAQ - Ordre des architectes du Québec', description: 'Protège le public en matière d\'architecture', url: 'https://www.oaq.com', logo: '🏛️', phone: '514-937-6168', members: '4 500+' },
]

export default function Associations() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <PageTitle title="Associations professionnelles" />
        <p className="text-gray-500 mt-1">Organismes et associations de l'industrie de la construction au Québec</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {ASSOCIATIONS.map(assoc => (
          <div key={assoc.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{assoc.logo}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{assoc.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{assoc.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Users size={14} />{assoc.members} membres</span>
                  <span className="flex items-center gap-1"><Phone size={14} />{assoc.phone}</span>
                </div>
                <a href={assoc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">
                  <Globe size={16} />Visiter le site<ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
