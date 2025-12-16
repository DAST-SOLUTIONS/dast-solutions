/**
 * DAST Solutions - MERX
 * Appels d'offres fédéraux canadiens
 */
import { useState } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { Search, ExternalLink, Building, MapPin, Calendar, DollarSign, Star, RefreshCw, Filter, Bell, Eye } from 'lucide-react'

const DEMO_APPELS = [
  { id: '1', numero: 'W8485-230001', titre: 'Rénovation bâtiment fédéral Ottawa', organisme: 'Services publics Canada', region: 'Ontario', dateFermeture: '2025-01-20', budget: '2-5M$', status: 'ouvert' },
  { id: '2', numero: 'W8485-230002', titre: 'Construction hangar aéroport Montréal', organisme: 'Transports Canada', region: 'Québec', dateFermeture: '2025-02-15', budget: '5-10M$', status: 'ouvert' },
  { id: '3', numero: 'W8485-230003', titre: 'Modernisation poste frontière', organisme: 'ASFC', region: 'Québec', dateFermeture: '2025-01-30', budget: '1-2M$', status: 'ouvert' },
]

export default function MERXPage() {
  const [search, setSearch] = useState('')
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div><PageTitle title="MERX - Appels d'offres fédéraux" /><p className="text-gray-500 mt-1">Marchés publics du gouvernement canadien</p></div>
        <a href="https://www.merx.com" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><ExternalLink size={18} />Accéder à MERX</a>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEMO_APPELS.map(a => (
          <div key={a.id} className="bg-white rounded-xl border p-5 hover:shadow-lg transition">
            <div className="text-xs font-mono text-gray-500 mb-2">{a.numero}</div>
            <h3 className="font-semibold text-gray-900 mb-3">{a.titre}</h3>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2"><Building size={14} />{a.organisme}</div>
              <div className="flex items-center gap-2"><MapPin size={14} />{a.region}</div>
              <div className="flex items-center gap-2"><Calendar size={14} />Ferme: {a.dateFermeture}</div>
              <div className="flex items-center gap-2"><DollarSign size={14} />{a.budget}</div>
            </div>
            <a href="https://www.merx.com" target="_blank" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Eye size={16} />Voir détails</a>
          </div>
        ))}
      </div>
    </div>
  )
}
