/**
 * DAST Solutions - Bottin Ressources
 * Gestion des individus, équipes et équipements
 */
import { useState } from 'react'
import { Users, Wrench, Users2, Plus, Search, Edit, Trash2, X, Phone, Mail, ChevronDown, ChevronRight, UserPlus } from 'lucide-react'
import { useBottin } from '@/hooks/useBottin'
import { METIERS_CCQ, CLASSIFICATIONS_CCQ, CATEGORIES_EQUIPEMENT } from '@/types/modules'

export default function BottinRessources() {
  const [activeTab, setActiveTab] = useState<'individus' | 'equipes' | 'equipements'>('individus')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})

  const {
    individus, equipements, equipes, loading,
    createIndividu, updateIndividu, deleteIndividu,
    createEquipement, updateEquipement, deleteEquipement,
    createEquipe, deleteEquipe,
    addMembreEquipe, removeMembreEquipe,
    addEquipementEquipe, removeEquipementEquipe
  } = useBottin()

  const tabs = [
    { id: 'individus', label: 'Individus', icon: Users, count: individus.length },
    { id: 'equipes', label: 'Équipes', icon: Users2, count: equipes.length },
    { id: 'equipements', label: 'Équipements', icon: Wrench, count: equipements.length },
  ]

  const filteredIndividus = individus.filter(ind => {
    const matchSearch = searchQuery === '' || `${ind.prenom} ${ind.nom}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = filterType === 'all' || ind.type === filterType
    return matchSearch && matchType
  })

  const filteredEquipements = equipements.filter(eq => {
    const matchSearch = searchQuery === '' || eq.nom.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = filterType === 'all' || eq.categorie === filterType
    return matchSearch && matchCat
  })

  const handleSubmitIndividu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) await updateIndividu(editingId, formData)
    else await createIndividu(formData)
    setShowForm(false); setEditingId(null); setFormData({})
  }

  const handleSubmitEquipement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) await updateEquipement(editingId, formData)
    else await createEquipement(formData)
    setShowForm(false); setEditingId(null); setFormData({})
  }

  const handleAddEquipe = async () => {
    const nom = prompt('Nom de l\'équipe:')
    if (nom) await createEquipe({ nom })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'employe': return 'bg-teal-100 text-teal-700'
      case 'sous_traitant': return 'bg-purple-100 text-purple-700'
      case 'contact': return 'bg-blue-100 text-blue-700'
      case 'fournisseur': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-900">Bottin Ressources</h1><p className="text-gray-600">Gérez vos contacts, équipes et équipements</p></div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setFilterType('all') }}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${activeTab === tab.id ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <tab.icon size={18} />{tab.label}<span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
        </div>
        {activeTab === 'individus' && (
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="all">Tous types</option>
            <option value="employe">Employés</option>
            <option value="sous_traitant">Sous-traitants</option>
            <option value="contact">Contacts</option>
            <option value="fournisseur">Fournisseurs</option>
          </select>
        )}
        {activeTab === 'equipements' && (
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="all">Toutes catégories</option>
            {CATEGORIES_EQUIPEMENT.map(c => <option key={c.code} value={c.code}>{c.nom}</option>)}
          </select>
        )}
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(activeTab === 'individus' ? { type: 'employe', actif: true } : { categorie: 'outillage', statut: 'disponible', actif: true }) }} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />{activeTab === 'individus' ? 'Nouvel individu' : activeTab === 'equipes' ? 'Nouvelle équipe' : 'Nouvel équipement'}
        </button>
      </div>

      {activeTab === 'individus' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIndividus.map(ind => (
            <div key={ind.id} className={`card p-4 ${!ind.actif ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-semibold">{ind.prenom[0]}{ind.nom[0]}</div>
                  <div><p className="font-medium text-gray-900">{ind.prenom} {ind.nom}</p><span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(ind.type)}`}>{ind.type === 'employe' ? 'Employé' : ind.type === 'sous_traitant' ? 'Sous-traitant' : ind.type === 'contact' ? 'Contact' : 'Fournisseur'}</span></div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setFormData(ind); setEditingId(ind.id); setShowForm(true) }} className="p-1 text-gray-400 hover:text-teal-600"><Edit size={16} /></button>
                  <button onClick={() => { if(confirm('Supprimer?')) deleteIndividu(ind.id) }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                {ind.email && <p className="flex items-center gap-2"><Mail size={14} /> {ind.email}</p>}
                {ind.telephone && <p className="flex items-center gap-2"><Phone size={14} /> {ind.telephone}</p>}
                {ind.metier_ccq && <p className="text-xs text-gray-500">{METIERS_CCQ.find(m => m.code === ind.metier_ccq)?.nom}</p>}
                {ind.taux_horaire_base > 0 && <p className="font-medium text-teal-600">{ind.taux_horaire_base.toFixed(2)} $/h</p>}
              </div>
            </div>
          ))}
          {filteredIndividus.length === 0 && <div className="col-span-3 text-center py-12 text-gray-500"><Users className="mx-auto mb-4 text-gray-300" size={48} /><p>Aucun individu trouvé</p></div>}
        </div>
      )}

      {activeTab === 'equipes' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={handleAddEquipe} className="btn btn-primary flex items-center gap-2"><Plus size={18} /> Nouvelle équipe</button></div>
          {equipes.map(equipe => <EquipeCard key={equipe.id} equipe={equipe} individus={individus} equipements={equipements} onDelete={() => deleteEquipe(equipe.id)} onAddMembre={(indId: string) => addMembreEquipe(equipe.id, indId)} onRemoveMembre={(membreId: string) => removeMembreEquipe(membreId, equipe.id)} onAddEquipement={(eqId: string) => addEquipementEquipe(equipe.id, eqId)} onRemoveEquipement={(eeId: string) => removeEquipementEquipe(eeId, equipe.id)} />)}
          {equipes.length === 0 && <div className="text-center py-12 text-gray-500"><Users2 className="mx-auto mb-4 text-gray-300" size={48} /><p>Aucune équipe créée</p></div>}
        </div>
      )}

      {activeTab === 'equipements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipements.map(eq => (
            <div key={eq.id} className={`card p-4 ${!eq.actif ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center"><Wrench size={20} /></div>
                  <div><p className="font-medium text-gray-900">{eq.nom}</p><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{CATEGORIES_EQUIPEMENT.find(c => c.code === eq.categorie)?.nom}</span></div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${eq.statut === 'disponible' ? 'bg-green-100 text-green-700' : eq.statut === 'en_utilisation' ? 'bg-blue-100 text-blue-700' : eq.statut === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{eq.statut}</span>
              </div>
              <div className="space-y-1 text-sm">
                {eq.cout_horaire > 0 && <p className="text-gray-600">{eq.cout_horaire.toFixed(2)} $/h</p>}
                {eq.cout_journalier > 0 && <p className="text-gray-600">{eq.cout_journalier.toFixed(2)} $/jour</p>}
                {eq.est_loue && <p className="text-xs text-orange-600">Loué</p>}
              </div>
              <div className="flex justify-end gap-1 mt-3">
                <button onClick={() => { setFormData(eq); setEditingId(eq.id); setShowForm(true) }} className="p-1 text-gray-400 hover:text-teal-600"><Edit size={16} /></button>
                <button onClick={() => { if(confirm('Supprimer?')) deleteEquipement(eq.id) }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {filteredEquipements.length === 0 && <div className="col-span-3 text-center py-12 text-gray-500"><Wrench className="mx-auto mb-4 text-gray-300" size={48} /><p>Aucun équipement trouvé</p></div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editingId ? 'Modifier' : 'Ajouter'} {activeTab === 'individus' ? 'un individu' : 'un équipement'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            {activeTab === 'individus' ? (
              <form onSubmit={handleSubmitIndividu} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label><input type="text" required value={formData.prenom || ''} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label><input type="text" required value={formData.nom || ''} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="input-field" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Type *</label><select required value={formData.type || 'employe'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input-field"><option value="employe">Employé</option><option value="sous_traitant">Sous-traitant</option><option value="contact">Contact</option><option value="fournisseur">Fournisseur</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label><input type="tel" value={formData.telephone || ''} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Taux horaire ($)</label><input type="number" step="0.01" value={formData.taux_horaire_base || ''} onChange={(e) => setFormData({ ...formData, taux_horaire_base: parseFloat(e.target.value) || 0 })} className="input-field" /></div>
                </div>
                {(formData.type === 'employe' || formData.type === 'sous_traitant') && (
                  <div className="bg-teal-50 p-4 rounded-lg"><h4 className="font-medium text-teal-900 mb-3">Information CCQ</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Métier CCQ</label><select value={formData.metier_ccq || ''} onChange={(e) => setFormData({ ...formData, metier_ccq: e.target.value })} className="input-field"><option value="">Sélectionner...</option>{METIERS_CCQ.map(m => <option key={m.code} value={m.code}>{m.nom}</option>)}</select></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Classification</label><select value={formData.classification || ''} onChange={(e) => setFormData({ ...formData, classification: e.target.value })} className="input-field"><option value="">Sélectionner...</option>{CLASSIFICATIONS_CCQ.map(c => <option key={c.code} value={c.code}>{c.nom}</option>)}</select></div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t"><button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Annuler</button><button type="submit" className="btn btn-primary">{editingId ? 'Modifier' : 'Créer'}</button></div>
              </form>
            ) : (
              <form onSubmit={handleSubmitEquipement} className="p-4 space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label><input type="text" required value={formData.nom || ''} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="input-field" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label><select required value={formData.categorie || 'outillage'} onChange={(e) => setFormData({ ...formData, categorie: e.target.value })} className="input-field">{CATEGORIES_EQUIPEMENT.map(c => <option key={c.code} value={c.code}>{c.nom}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Statut</label><select value={formData.statut || 'disponible'} onChange={(e) => setFormData({ ...formData, statut: e.target.value })} className="input-field"><option value="disponible">Disponible</option><option value="en_utilisation">En utilisation</option><option value="maintenance">Maintenance</option><option value="hors_service">Hors service</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Coût horaire ($)</label><input type="number" step="0.01" value={formData.cout_horaire || ''} onChange={(e) => setFormData({ ...formData, cout_horaire: parseFloat(e.target.value) || 0 })} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Coût journalier ($)</label><input type="number" step="0.01" value={formData.cout_journalier || ''} onChange={(e) => setFormData({ ...formData, cout_journalier: parseFloat(e.target.value) || 0 })} className="input-field" /></div>
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

function EquipeCard({ equipe, individus, equipements, onDelete, onAddMembre, onRemoveMembre, onAddEquipement, onRemoveEquipement }: any) {
  const [expanded, setExpanded] = useState(false)
  const [showAddMembre, setShowAddMembre] = useState(false)
  const [showAddEquip, setShowAddEquip] = useState(false)

  return (
    <div className="card">
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">{expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}<div><h3 className="font-semibold text-gray-900">{equipe.nom}</h3><p className="text-sm text-gray-500">{equipe.membres?.length || 0} membres • {equipe.equipements?.length || 0} équipements</p></div></div>
        <div className="flex items-center gap-4"><div className="text-right"><p className="font-medium text-teal-600">{equipe.cout_horaire_total?.toFixed(2) || '0.00'} $/h</p><p className="text-sm text-gray-500">{equipe.cout_journalier_total?.toFixed(2) || '0.00'} $/jour</p></div><button onClick={(e) => { e.stopPropagation(); if(confirm('Supprimer?')) onDelete() }} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button></div>
      </div>
      {expanded && (
        <div className="border-t p-4 grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3"><h4 className="font-medium text-gray-700">Membres</h4><button onClick={() => setShowAddMembre(!showAddMembre)} className="text-teal-600 hover:text-teal-800 text-sm flex items-center gap-1"><UserPlus size={14} /> Ajouter</button></div>
            {showAddMembre && <select onChange={(e) => { if(e.target.value) { onAddMembre(e.target.value); setShowAddMembre(false) } }} className="input-field text-sm mb-2"><option value="">Sélectionner...</option>{individus.filter((i: any) => !equipe.membres?.find((m: any) => m.individu_id === i.id)).map((i: any) => <option key={i.id} value={i.id}>{i.prenom} {i.nom}</option>)}</select>}
            <div className="space-y-2">{equipe.membres?.map((m: any) => <div key={m.id} className="flex items-center justify-between bg-gray-50 p-2 rounded"><span className="text-sm">{m.individu?.prenom} {m.individu?.nom}</span><button onClick={() => onRemoveMembre(m.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button></div>)}</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3"><h4 className="font-medium text-gray-700">Équipements</h4><button onClick={() => setShowAddEquip(!showAddEquip)} className="text-teal-600 hover:text-teal-800 text-sm flex items-center gap-1"><Wrench size={14} /> Ajouter</button></div>
            {showAddEquip && <select onChange={(e) => { if(e.target.value) { onAddEquipement(e.target.value); setShowAddEquip(false) } }} className="input-field text-sm mb-2"><option value="">Sélectionner...</option>{equipements.filter((eq: any) => !equipe.equipements?.find((ee: any) => ee.equipement_id === eq.id)).map((eq: any) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}</select>}
            <div className="space-y-2">{equipe.equipements?.map((ee: any) => <div key={ee.id} className="flex items-center justify-between bg-gray-50 p-2 rounded"><span className="text-sm">{ee.equipement?.nom}</span><button onClick={() => onRemoveEquipement(ee.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button></div>)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
