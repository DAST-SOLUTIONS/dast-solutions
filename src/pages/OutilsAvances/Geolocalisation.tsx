/**
 * DAST Solutions - Géolocalisation
 * Carte des projets et suivi des équipes
 */
import { useState } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { MapPin, Navigation, Users, Building, Layers, Search, Filter, RefreshCw, Target, Compass, Map, Satellite } from 'lucide-react'

const DEMO_LOCATIONS = [
  { id: '1', name: 'Centre sportif Montréal', lat: 45.5017, lng: -73.5673, type: 'projet', status: 'actif', equipe: 8 },
  { id: '2', name: 'École primaire Laval', lat: 45.5589, lng: -73.7491, type: 'projet', status: 'actif', equipe: 5 },
  { id: '3', name: 'Hôpital Maisonneuve', lat: 45.5553, lng: -73.5478, type: 'projet', status: 'pause', equipe: 0 },
  { id: '4', name: 'Entrepôt principal', lat: 45.5088, lng: -73.5878, type: 'depot', status: 'actif', equipe: 2 },
]

export default function Geolocalisation() {
  const [mapType, setMapType] = useState<'map' | 'satellite'>('map')
  const [filter, setFilter] = useState<'all' | 'projet' | 'depot'>('all')
  const locations = DEMO_LOCATIONS.filter(l => filter === 'all' || l.type === filter)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div><PageTitle title="Géolocalisation" /><p className="text-gray-500 mt-1">Carte des projets et suivi des équipes</p></div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><RefreshCw size={18} />Actualiser</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Target size={18} />Ma position</button>
        </div>
      </div>
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex gap-2">
              <button onClick={() => setMapType('map')} className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${mapType === 'map' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}><Map size={16} />Plan</button>
              <button onClick={() => setMapType('satellite')} className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${mapType === 'satellite' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}><Satellite size={16} />Satellite</button>
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="px-3 py-1.5 border rounded-lg">
              <option value="all">Tous les lieux</option>
              <option value="projet">Projets</option>
              <option value="depot">Dépôts</option>
            </select>
          </div>
          <div className="h-[500px] bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Carte interactive</p>
              <p className="text-sm">Intégration Google Maps / Mapbox à venir</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-4">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-500">Projets actifs</span><span className="font-semibold">{locations.filter(l => l.status === 'actif' && l.type === 'projet').length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Équipes sur terrain</span><span className="font-semibold">{locations.reduce((s, l) => s + l.equipe, 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Dépôts</span><span className="font-semibold">{locations.filter(l => l.type === 'depot').length}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-4">Sites ({locations.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {locations.map(l => (
                <div key={l.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className={l.type === 'projet' ? 'text-teal-500' : 'text-amber-500'} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{l.name}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-1.5 py-0.5 rounded ${l.status === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{l.status}</span>
                        {l.equipe > 0 && <span className="flex items-center gap-1"><Users size={12} />{l.equipe}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
