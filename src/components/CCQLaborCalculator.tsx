/**
 * DAST Solutions - Calculateur Main-d'œuvre CCQ - Taux 2024
 */
import { useState, useEffect } from 'react'
import { HardHat, Plus, X, Search, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react'

export interface CCQTrade { id: string; code: string; name: string; sector: string; hourly_rate: number; benefits_rate: number; total_rate: number }
export interface LaborItem { id: string; trade: CCQTrade; hours: number; quantity: number; total: number; notes?: string }

const CCQ_RATES: CCQTrade[] = [
  { id: '1', code: 'CARP', name: 'Charpentier-menuisier', sector: 'IC', hourly_rate: 43.56, benefits_rate: 22.15, total_rate: 65.71 },
  { id: '2', code: 'ELEC', name: 'Électricien', sector: 'IC', hourly_rate: 46.23, benefits_rate: 23.52, total_rate: 69.75 },
  { id: '3', code: 'PLOM', name: 'Plombier', sector: 'IC', hourly_rate: 45.89, benefits_rate: 23.34, total_rate: 69.23 },
  { id: '4', code: 'SOUD', name: 'Soudeur', sector: 'IC', hourly_rate: 44.12, benefits_rate: 22.44, total_rate: 66.56 },
  { id: '5', code: 'FERR', name: 'Ferblantier', sector: 'IC', hourly_rate: 44.78, benefits_rate: 22.78, total_rate: 67.56 },
  { id: '6', code: 'BRIC', name: 'Briqueteur-maçon', sector: 'IC', hourly_rate: 44.23, benefits_rate: 22.50, total_rate: 66.73 },
  { id: '7', code: 'PEINT', name: 'Peintre', sector: 'IC', hourly_rate: 40.12, benefits_rate: 20.41, total_rate: 60.53 },
  { id: '8', code: 'PLAT', name: 'Plâtrier', sector: 'IC', hourly_rate: 42.34, benefits_rate: 21.53, total_rate: 63.87 },
  { id: '9', code: 'COUV', name: 'Couvreur', sector: 'IC', hourly_rate: 43.12, benefits_rate: 21.93, total_rate: 65.05 },
  { id: '10', code: 'CIMENT', name: 'Cimentier-applicateur', sector: 'IC', hourly_rate: 42.89, benefits_rate: 21.82, total_rate: 64.71 },
  { id: '11', code: 'GRUE', name: 'Grutier', sector: 'IC', hourly_rate: 47.56, benefits_rate: 24.20, total_rate: 71.76 },
  { id: '12', code: 'JOURN', name: 'Journalier', sector: 'IC', hourly_rate: 35.23, benefits_rate: 17.92, total_rate: 53.15 },
  { id: '13', code: 'MECA', name: 'Mécanicien de chantier', sector: 'IC', hourly_rate: 45.34, benefits_rate: 23.06, total_rate: 68.40 },
  { id: '14', code: 'FRIGO', name: 'Frigoriste', sector: 'IC', hourly_rate: 46.78, benefits_rate: 23.80, total_rate: 70.58 },
  { id: '15', code: 'TUYAU', name: 'Tuyauteur', sector: 'IC', hourly_rate: 46.12, benefits_rate: 23.46, total_rate: 69.58 },
  { id: '16', code: 'POSEUR', name: 'Poseur systèmes intérieurs', sector: 'IC', hourly_rate: 41.23, benefits_rate: 20.97, total_rate: 62.20 },
  { id: '17', code: 'VITRIER', name: 'Vitrier', sector: 'IC', hourly_rate: 43.45, benefits_rate: 22.10, total_rate: 65.55 }
]

interface Props { projectId: string; onTotalChange?: (total: number) => void; className?: string }

export default function CCQLaborCalculator({ projectId, onTotalChange, className = '' }: Props) {
  const [laborItems, setLaborItems] = useState<LaborItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTrade, setSelectedTrade] = useState<CCQTrade | null>(null)
  const [hours, setHours] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [expanded, setExpanded] = useState(true)

  const total = laborItems.reduce((sum, item) => sum + item.total, 0)
  useEffect(() => { onTotalChange?.(total) }, [total])

  const filteredTrades = CCQ_RATES.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.code.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleAdd = () => {
    if (!selectedTrade || !hours) return
    const h = parseFloat(hours), q = parseFloat(quantity) || 1
    setLaborItems([...laborItems, { id: Date.now().toString(), trade: selectedTrade, hours: h, quantity: q, total: h * q * selectedTrade.total_rate, notes }])
    setSelectedTrade(null); setHours(''); setQuantity('1'); setNotes(''); setShowModal(false)
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm ${className}`}>
      <div className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><HardHat className="text-amber-600" size={20} /></div>
          <div><h3 className="font-semibold">Main-d'œuvre CCQ</h3><p className="text-sm text-gray-500">{laborItems.length} poste(s)</p></div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-amber-600">{total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          {laborItems.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
              <div>
                <span className="font-medium">{item.trade.name}</span>
                <span className="text-xs ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded">{item.trade.code}</span>
                <div className="text-sm text-gray-500">{item.hours}h × {item.quantity} @ {item.trade.total_rate.toFixed(2)}$/h</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{item.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                <button onClick={() => setLaborItems(laborItems.filter(l => l.id !== item.id))} className="p-1 text-red-500"><X size={16} /></button>
              </div>
            </div>
          ))}
          <button onClick={() => setShowModal(true)} className="w-full py-3 border-2 border-dashed rounded-lg text-gray-500 hover:border-amber-400 hover:text-amber-600 flex items-center justify-center gap-2">
            <Plus size={18} /> Ajouter main-d'œuvre
          </button>
          <div className="mt-4 p-3 bg-amber-50 rounded-lg text-xs text-amber-800">
            <AlertCircle size={14} className="inline mr-1" /> Taux CCQ 2024 - Secteur IC (salaire + avantages ~51%)
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between"><h2 className="text-lg font-bold">Ajouter main-d'œuvre</h2><button onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredTrades.map(trade => (
                <button key={trade.id} onClick={() => setSelectedTrade(trade)} className={`w-full p-3 rounded-lg text-left flex justify-between mb-1 ${selectedTrade?.id === trade.id ? 'bg-amber-100 border-2 border-amber-400' : 'hover:bg-gray-50 border-2 border-transparent'}`}>
                  <div><span className="font-medium">{trade.name}</span><span className="text-xs ml-2 bg-gray-100 px-2 py-0.5 rounded">{trade.code}</span></div>
                  <span className="font-bold text-amber-600">{trade.total_rate.toFixed(2)}$/h</span>
                </button>
              ))}
            </div>
            {selectedTrade && (
              <div className="p-4 border-t bg-gray-50">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className="text-sm font-medium">Heures</label><input type="number" value={hours} onChange={(e) => setHours(e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="text-sm font-medium">Quantité</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div>
                {hours && <div className="p-3 bg-amber-100 rounded-lg mb-4 text-center"><span className="text-xl font-bold text-amber-700">{(parseFloat(hours) * parseFloat(quantity || '1') * selectedTrade.total_rate).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span></div>}
                <div className="flex gap-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Annuler</button>
                  <button onClick={handleAdd} disabled={!hours} className="flex-1 py-2 bg-amber-500 text-white rounded-lg disabled:opacity-50">Ajouter</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { CCQ_RATES }