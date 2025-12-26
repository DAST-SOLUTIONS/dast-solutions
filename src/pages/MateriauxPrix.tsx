/**
 * DAST Solutions - Page Matériaux & Prix
 */
import { useState } from 'react'
import { Package, Plus, Search, Edit, Trash2, X, Star, StarOff, Clock } from 'lucide-react'
import { useMateriauxPrix } from '@/hooks/useMateriauxPrix'
import { METIERS_CCQ } from '@/types/modules'
import type { Materiau, Productivite } from '@/types/modules'

const UNITES = [
  { code: 'PI2', nom: 'Pied carré' },
  { code: 'PI', nom: 'Pied linéaire' },
  { code: 'U', nom: 'Unité' },
  { code: 'M2', nom: 'Mètre carré' },
  { code: 'M', nom: 'Mètre linéaire' },
  { code: 'KG', nom: 'Kilogramme' },
  { code: 'SAC', nom: 'Sac' },
]

export default function MateriauxPrixPage() {
  const [activeTab, setActiveTab] = useState<'materiaux' | 'productivites'>('materiaux')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategorie, setFilterCategorie] = useState<string>('all')
  const [showFavorisOnly, setShowFavorisOnly] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})

  const {
    materiaux, categories, productivites, loading,
    createMateriau, updateMateriau, deleteMateriau, toggleFavori,
    createProductivite, updateProductivite, deleteProductivite
  } = useMateriauxPrix()

  const filteredMateriaux = materiaux.filter(mat => {
    const matchSearch = searchQuery === '' || mat.nom.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategorie = filterCategorie === 'all' || mat.categorie_csc === filterCategorie
    const matchFavori = !showFavorisOnly || mat.favori
    return matchSearch && matchCategorie && matchFavori
  })

  const filteredProductivites = productivites.filter(p => 
    searchQuery === '' || p.nom.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmitMateriau = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) await updateMateriau(editingId, formData)
    else await createMateriau(formData)
    setShowForm(false); setEditingId(null); setFormData({})
  }

  const handleSubmitProductivite = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...formData }
    if (data.quantite_par_heure && !data.quantite_par_jour) data.quantite_par_jour = data.quantite_par_heure * 8
    if (editingId) await updateProductivite(editingId, data)
    else await createProductivite(data)
    setShowForm(false); setEditingId(null); setFormData({})
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Matériaux & Prix</h1><p className="text-gray-600">Catalogue de matériaux et taux de productivité</p></div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('materiaux')} className={`flex items-center gap-2 px-4 py-3 font-medium ${activeTab === 'materiaux' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-600'}`}>
          <Package size={18} /> Catalogue ({materiaux.length})
        </button>
        <button onClick={() => setActiveTab('productivites')} className={`flex items-center gap-2 px-4 py-3 font-medium ${activeTab === 'productivites' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-600'}`}>
          <Clock size={18} /> Productivités ({productivites.length})
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        {activeTab === 'materiaux' && (
          <>
            <select value={filterCategorie} onChange={(e) => setFilterCategorie(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="all">Toutes catégories</option>
              {categories.map(cat => <option key={cat.id} value={cat.code}>{cat.code} - {cat.nom}</option>)}
            </select>
            <button onClick={() => setShowFavorisOnly(!showFavorisOnly)} className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${showFavorisOnly ? 'bg-yellow-50 border-yellow-300' : 'border-gray-300'}`}>
              <Star size={18} className={showFavorisOnly ? 'fill-yellow-500 text-yellow-500' : ''} /> Favoris
            </button>
          </>
        )}
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(activeTab === 'materiaux' ? { unite: 'U', prix_unitaire: 0, actif: true } : { unite_travail: 'PI2', quantite_par_heure: 0, facteur_simple: 1, facteur_moyen: 1.2, facteur_complexe: 1.5, facteur_tres_complexe: 2, actif: true }) }} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      {/* Content */}
      {activeTab === 'materiaux' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Matériau</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Cat.</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Unité</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Prix</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Perte</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Fournisseur</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredMateriaux.map(mat => (
                <tr key={mat.id} className={`hover:bg-gray-50 ${!mat.actif ? 'opacity-50' : ''}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleFavori(mat.id)} className="text-gray-300 hover:text-yellow-500">
                        {mat.favori ? <Star size={16} className="fill-yellow-500 text-yellow-500" /> : <StarOff size={16} />}
                      </button>
                      <div><p className="font-medium text-gray-900">{mat.nom}</p>{mat.code && <p className="text-xs text-gray-500">{mat.code}</p>}</div>
                    </div>
                  </td>
                  <td className="p-3"><span className="bg-gray-100 text-xs px-2 py-1 rounded">{mat.categorie_csc || '-'}</span></td>
                  <td className="p-3 text-center text-sm">{mat.unite}</td>
                  <td className="p-3 text-right font-medium">{mat.prix_unitaire.toFixed(2)} $</td>
                  <td className="p-3 text-center">{mat.facteur_perte > 0 && <span className="text-orange-600 text-sm">{mat.facteur_perte}%</span>}</td>
                  <td className="p-3 text-sm text-gray-600">{mat.fournisseur_nom || '-'}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setFormData(mat); setEditingId(mat.id); setShowForm(true) }} className="p-1 text-gray-400 hover:text-teal-600"><Edit size={16} /></button>
                      <button onClick={() => { if(confirm('Supprimer?')) deleteMateriau(mat.id) }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMateriaux.length === 0 && <div className="text-center py-12 text-gray-500"><Package className="mx-auto mb-4 text-gray-300" size={48} /><p>Aucun matériau trouvé</p></div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProductivites.map(prod => (
            <div key={prod.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="font-medium text-gray-900">{prod.nom}</h3>{prod.categorie && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{prod.categorie}</span>}</div>
                <button onClick={() => deleteProductivite(prod.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Productivité:</span><span className="font-bold text-teal-600">{prod.quantite_par_heure} {prod.unite_travail}/h</span></div>
              <div className="grid grid-cols-4 gap-1 text-xs mt-2">
                <div className="bg-green-50 p-1 rounded text-center"><p className="text-green-700 font-medium">×{prod.facteur_simple}</p></div>
                <div className="bg-yellow-50 p-1 rounded text-center"><p className="text-yellow-700 font-medium">×{prod.facteur_moyen}</p></div>
                <div className="bg-orange-50 p-1 rounded text-center"><p className="text-orange-700 font-medium">×{prod.facteur_complexe}</p></div>
                <div className="bg-red-50 p-1 rounded text-center"><p className="text-red-700 font-medium">×{prod.facteur_tres_complexe}</p></div>
              </div>
            </div>
          ))}
          {filteredProductivites.length === 0 && <div className="col-span-3 text-center py-12 text-gray-500"><Clock className="mx-auto mb-4 text-gray-300" size={48} /><p>Aucune productivité trouvée</p></div>}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editingId ? 'Modifier' : 'Nouveau'} {activeTab === 'materiaux' ? 'matériau' : 'productivité'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            {activeTab === 'materiaux' ? (
              <form onSubmit={handleSubmitMateriau} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-sm font-medium mb-1">Nom *</label><input type="text" required value={formData.nom || ''} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="input-field" /></div>
                  <div><label className="block text-sm font-medium mb-1">Code</label><input type="text" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="input-field" /></div>
                  <div><label className="block text-sm font-medium mb-1">Catégorie CSC</label><select value={formData.categorie_csc || ''} onChange={(e) => setFormData({ ...formData, categorie_csc: e.target.value })} className="input-field"><option value="">Sélectionner...</option>{categories.map(cat => <option key={cat.id} value={cat.code}>{cat.code} - {cat.nom}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Unité *</label><select required value={formData.unite || 'U'} onChange={(e) => setFormData({ ...formData, unite: e.target.value })} className="input-field">{UNITES.map(u => <option key={u.code} value={u.code}>{u.code}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Prix unitaire *</label><input type="number" required step="0.0001" value={formData.prix_unitaire || ''} onChange={(e) => setFormData({ ...formData, prix_unitaire: parseFloat(e.target.value) })} className="input-field" /></div>
                  <div><label className="block text-sm font-medium mb-1">Perte %</label><input type="number" step="0.1" value={formData.facteur_perte || ''} onChange={(e) => setFormData({ ...formData, facteur_perte: parseFloat(e.target.value) })} className="input-field" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Fournisseur</label><input type="text" value={formData.fournisseur_nom || ''} onChange={(e) => setFormData({ ...formData, fournisseur_nom: e.target.value })} className="input-field" /></div>
                  <div><label className="block text-sm font-medium mb-1">Code fournisseur</label><input type="text" value={formData.fournisseur_code || ''} onChange={(e) => setFormData({ ...formData, fournisseur_code: e.target.value })} className="input-field" /></div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t"><button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Annuler</button><button type="submit" className="btn btn-primary">{editingId ? 'Modifier' : 'Créer'}</button></div>
              </form>
            ) : (
              <form onSubmit={handleSubmitProductivite} className="p-4 space-y-4">
                <div><label className="block text-sm font-medium mb-1">Nom *</label><input type="text" required value={formData.nom || ''} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="input-field" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Unité de travail *</label><select required value={formData.unite_travail || 'PI2'} onChange={(e) => setFormData({ ...formData, unite_travail: e.target.value })} className="input-field">{UNITES.slice(0, 5).map(u => <option key={u.code} value={u.code}>{u.code}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Quantité / heure *</label><input type="number" required step="0.01" value={formData.quantite_par_heure || ''} onChange={(e) => setFormData({ ...formData, quantite_par_heure: parseFloat(e.target.value) })} className="input-field" /></div>
                  <div><label className="block text-sm font-medium mb-1">Métier CCQ</label><select value={formData.metier_ccq || ''} onChange={(e) => setFormData({ ...formData, metier_ccq: e.target.value })} className="input-field"><option value="">Sélectionner...</option>{METIERS_CCQ.map(m => <option key={m.code} value={m.code}>{m.nom}</option>)}</select></div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900 mb-3">Facteurs de complexité</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div><label className="block text-xs mb-1">Simple</label><input type="number" step="0.1" value={formData.facteur_simple || 1} onChange={(e) => setFormData({ ...formData, facteur_simple: parseFloat(e.target.value) })} className="input-field text-sm" /></div>
                    <div><label className="block text-xs mb-1">Moyen</label><input type="number" step="0.1" value={formData.facteur_moyen || 1.2} onChange={(e) => setFormData({ ...formData, facteur_moyen: parseFloat(e.target.value) })} className="input-field text-sm" /></div>
                    <div><label className="block text-xs mb-1">Complexe</label><input type="number" step="0.1" value={formData.facteur_complexe || 1.5} onChange={(e) => setFormData({ ...formData, facteur_complexe: parseFloat(e.target.value) })} className="input-field text-sm" /></div>
                    <div><label className="block text-xs mb-1">Très complexe</label><input type="number" step="0.1" value={formData.facteur_tres_complexe || 2} onChange={(e) => setFormData({ ...formData, facteur_tres_complexe: parseFloat(e.target.value) })} className="input-field text-sm" /></div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t"><button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Annuler</button><button type="submit" className="btn btn-primary">{editingId ? 'Modifier' : 'Créer'}</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
