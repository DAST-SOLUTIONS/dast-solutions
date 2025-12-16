/**
 * DAST Solutions - AchatsCanada / BuyandSell
 * Portail d'achats du gouvernement du Canada
 */
import { PageTitle } from '@/components/PageTitle'
import { ExternalLink, Search, Building, MapPin, Calendar, Eye } from 'lucide-react'
import { useState } from 'react'

const DEMO_APPELS = [
  { id: '1', numero: 'PW-24-001', titre: 'Rénovation bureaux fédéraux Gatineau', organisme: 'SPAC', dateFermeture: '2025-01-28', status: 'ouvert' },
]

export default function BuyGCPage() {
  const [search, setSearch] = useState('')
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div><PageTitle title="AchatsCanada" /><p className="text-gray-500 mt-1">Portail d'achats du gouvernement du Canada</p></div>
        <a href="https://achatsetventes.gc.ca" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><ExternalLink size={18} />AchatsCanada</a>
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
            <a href="https://achatsetventes.gc.ca" target="_blank" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Eye size={16} />Voir détails</a>
          </div>
        ))}
      </div>
    </div>
  )
}
