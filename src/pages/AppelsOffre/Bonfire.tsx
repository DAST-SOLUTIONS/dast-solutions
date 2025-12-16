/**
 * DAST Solutions - Bonfire
 * Plateforme d'appels d'offres municipaux
 */
import { useState } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { Search, ExternalLink, Building, MapPin, Calendar, Eye } from 'lucide-react'

const DEMO_APPELS = [
  { id: '1', numero: 'BF-2024-001', titre: 'Réfection aqueduc secteur nord', organisme: 'Ville de Toronto', dateFermeture: '2025-01-25', status: 'ouvert' },
  { id: '2', numero: 'BF-2024-002', titre: 'Construction centre communautaire', organisme: 'Ville de Vancouver', dateFermeture: '2025-02-10', status: 'ouvert' },
]

export default function BonfirePage() {
  const [search, setSearch] = useState('')
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div><PageTitle title="Bonfire - Appels d'offres municipaux" /><p className="text-gray-500 mt-1">Plateforme d'approvisionnement municipal</p></div>
        <a href="https://gobonfire.com" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><ExternalLink size={18} />Accéder à Bonfire</a>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {DEMO_APPELS.map(a => (
          <div key={a.id} className="bg-white rounded-xl border p-5 hover:shadow-lg transition">
            <div className="text-xs font-mono text-gray-500 mb-2">{a.numero}</div>
            <h3 className="font-semibold text-gray-900 mb-3">{a.titre}</h3>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2"><Building size={14} />{a.organisme}</div>
              <div className="flex items-center gap-2"><Calendar size={14} />Ferme: {a.dateFermeture}</div>
            </div>
            <a href="https://gobonfire.com" target="_blank" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Eye size={16} />Voir détails</a>
          </div>
        ))}
      </div>
    </div>
  )
}
