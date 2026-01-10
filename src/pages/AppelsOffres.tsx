/**
 * DAST Solutions - Page Appels d'Offres
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Plus, Trash2, Send, Users, DollarSign, Calendar, Mail, Check, X, ChevronDown, ChevronRight, Building2, MapPin, Globe, Lock } from 'lucide-react'
import { useAppelsOffres, useAppelOffreDetail } from '@/hooks/useAppelsOffres'
import { useBottin } from '@/hooks/useBottin'
import { supabase } from '@/lib/supabase'

export default function AppelsOffresPage() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [formData, setFormData] = useState({ 
    titre: '', 
    specialite: '', 
    date_limite: '',
    project_id: '',
    // Champs auto-remplis du projet
    address: '',
    city: '',
    province: 'QC',
    visibility: 'private',
    building_type: '',
    project_type: ''
  })
  const { appelsOffres, loading, createAppelOffre, deleteAppelOffre } = useAppelsOffres()

  // Charger les projets
  useEffect(() => {
    const loadProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setProjects(data || [])
    }
    loadProjects()
  }, [])

  // Auto-remplir les champs quand un projet est sélectionné
  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setFormData(prev => ({
        ...prev,
        project_id: projectId,
        titre: prev.titre || project.name,
        address: project.address || '',
        city: project.city || '',
        province: project.province || 'QC',
        visibility: project.visibility || 'private',
        building_type: project.building_type || '',
        project_type: project.project_type || ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        project_id: '',
        address: '',
        city: '',
        province: 'QC',
        visibility: 'private',
        building_type: '',
        project_type: ''
      }))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const ao = await createAppelOffre({
      ...formData,
      project_id: formData.project_id || null
    })
    if (ao) navigate(`/appels-offres/${ao.id}`)
    setShowForm(false)
    setFormData({ titre: '', specialite: '', date_limite: '', project_id: '', address: '', city: '', province: 'QC', visibility: 'private', building_type: '', project_type: '' })
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'bg-gray-100 text-gray-700'
      case 'envoye': case 'en_cours': return 'bg-blue-100 text-blue-700'
      case 'ferme': return 'bg-green-100 text-green-700'
      case 'annule': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-900">Appels d'Offres</h1><p className="text-gray-600">Gestion des invitations et soumissions</p></div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2"><Plus size={18} />Nouvel appel d'offres</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border"><p className="text-2xl font-bold text-gray-900">{appelsOffres.length}</p><p className="text-sm text-gray-500">Total</p></div>
        <div className="bg-white p-4 rounded-lg border"><p className="text-2xl font-bold text-blue-600">{appelsOffres.filter(ao => ao.statut === 'en_cours' || ao.statut === 'envoye').length}</p><p className="text-sm text-gray-500">En cours</p></div>
        <div className="bg-white p-4 rounded-lg border"><p className="text-2xl font-bold text-green-600">{appelsOffres.filter(ao => ao.statut === 'ferme').length}</p><p className="text-sm text-gray-500">Fermés</p></div>
        <div className="bg-white p-4 rounded-lg border"><p className="text-2xl font-bold text-purple-600">{appelsOffres.reduce((sum, ao) => sum + (ao.invitations?.length || 0), 0)}</p><p className="text-sm text-gray-500">Invitations</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appelsOffres.map(ao => (
          <div key={ao.id} className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/appels-offres/${ao.id}`)}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-mono text-sm text-teal-600">{ao.numero}</span>
                <h3 className="font-semibold text-gray-900">{ao.titre}</h3>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatutColor(ao.statut)}`}>{ao.statut}</span>
            </div>
            {ao.specialite && <p className="text-sm text-gray-600 mb-2">{ao.specialite}</p>}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span className="flex items-center gap-1"><Calendar size={14} />{new Date(ao.date_limite).toLocaleDateString('fr-CA')}</span>
              <span className="flex items-center gap-1"><Users size={14} />{ao.invitations?.length || 0} inv.</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${ao.invitations?.length ? (ao.soumissions_recues?.length || 0) / ao.invitations.length * 100 : 0}%` }}></div>
              </div>
              <span className="text-xs text-gray-500 ml-2">{ao.soumissions_recues?.length || 0}/{ao.invitations?.length || 0}</span>
            </div>
          </div>
        ))}
        {appelsOffres.length === 0 && <div className="col-span-3 text-center py-12 text-gray-500"><FileText className="mx-auto mb-4 text-gray-300" size={48} /><p>Aucun appel d'offres créé</p></div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Nouvel appel d'offres</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Sélection projet */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Building2 size={14} className="inline mr-1" />
                  Projet associé
                </label>
                <select 
                  value={formData.project_id} 
                  onChange={(e) => handleProjectSelect(e.target.value)} 
                  className="input-field"
                >
                  <option value="">-- Aucun projet (créer indépendamment) --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.project_number ? `${p.project_number} - ` : ''}{p.name}
                    </option>
                  ))}
                </select>
                {formData.project_id && (
                  <p className="text-xs text-teal-600 mt-1">✓ Les paramètres du projet seront utilisés</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input type="text" required value={formData.titre} onChange={(e) => setFormData({ ...formData, titre: e.target.value })} className="input-field" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Spécialité / Corps de métier</label>
                <input type="text" value={formData.specialite} onChange={(e) => setFormData({ ...formData, specialite: e.target.value })} className="input-field" placeholder="Ex: Maçonnerie, Électricité..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Date limite *</label>
                <input type="date" required value={formData.date_limite} onChange={(e) => setFormData({ ...formData, date_limite: e.target.value })} className="input-field" />
              </div>

              {/* Infos projet (si sélectionné, afficher en lecture seule) */}
              {formData.project_id && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Paramètres du projet</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {formData.address && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Adresse:</span>
                        <span className="ml-2">{formData.address}</span>
                      </div>
                    )}
                    {formData.city && (
                      <div>
                        <span className="text-gray-500">Ville:</span>
                        <span className="ml-2">{formData.city}, {formData.province}</span>
                      </div>
                    )}
                    {formData.building_type && (
                      <div>
                        <span className="text-gray-500">Bâtiment:</span>
                        <span className="ml-2">{formData.building_type}</span>
                      </div>
                    )}
                    {formData.project_type && (
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2">{formData.project_type}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {formData.visibility === 'public' ? (
                        <><Globe size={14} className="text-blue-600" /><span>Public</span></>
                      ) : (
                        <><Lock size={14} className="text-gray-600" /><span>Privé</span></>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setFormData({ titre: '', specialite: '', date_limite: '', project_id: '', address: '', city: '', province: 'QC', visibility: 'private', building_type: '', project_type: '' }) }} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export function AppelOffreDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'invitations' | 'soumissions' | 'comparatif'>('invitations')
  const [showAddInvitation, setShowAddInvitation] = useState(false)
  const [invitationForm, setInvitationForm] = useState({ entreprise_nom: '', contact_nom: '', email: '' })

  const { appelOffre, invitations, soumissionsRecues, loading, createInvitation, deleteInvitation, envoyerToutesInvitations, retenirSoumission, getStats } = useAppelOffreDetail(id || '')
  const { individus } = useBottin()
  const stats = getStats()

  const handleAddInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    await createInvitation(invitationForm)
    setShowAddInvitation(false)
    setInvitationForm({ entreprise_nom: '', contact_nom: '', email: '' })
  }

  const handleSelectFromBottin = (indId: string) => {
    const ind = individus.find(i => i.id === indId)
    if (ind) {
      setInvitationForm({ entreprise_nom: `${ind.prenom} ${ind.nom}`, contact_nom: `${ind.prenom} ${ind.nom}`, email: ind.email || '' })
    }
  }

  if (loading || !appelOffre) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate('/appels-offres')} className="text-gray-400 hover:text-gray-600">←</button>
            <h1 className="text-2xl font-bold text-gray-900">{appelOffre.numero}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${appelOffre.statut === 'ferme' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{appelOffre.statut}</span>
          </div>
          <p className="text-gray-600">{appelOffre.titre}</p>
        </div>
        <button onClick={envoyerToutesInvitations} className="btn btn-primary flex items-center gap-2" disabled={invitations.filter(i => i.statut === 'a_envoyer').length === 0}>
          <Send size={18} />Envoyer invitations ({invitations.filter(i => i.statut === 'a_envoyer').length})
        </button>
      </div>

      {/* Stats bar */}
      <div className="bg-white rounded-lg border p-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div><p className="text-sm text-gray-500">Invitations</p><p className="text-xl font-bold">{stats.totalInvitations}</p></div>
          <div><p className="text-sm text-gray-500">Soumissions reçues</p><p className="text-xl font-bold text-teal-600">{stats.soumissionsRecues}</p></div>
          <div><p className="text-sm text-gray-500">Prix min</p><p className="text-xl font-bold text-green-600">{stats.prixMin > 0 ? stats.prixMin.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }) : '-'}</p></div>
          <div><p className="text-sm text-gray-500">Prix max</p><p className="text-xl font-bold text-red-600">{stats.prixMax > 0 ? stats.prixMax.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }) : '-'}</p></div>
        </div>
        <div><p className="text-sm text-gray-500">Date limite</p><p className="text-xl font-bold">{new Date(appelOffre.date_limite).toLocaleDateString('fr-CA')}</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[{ id: 'invitations', label: 'Invitations', count: invitations.length }, { id: 'soumissions', label: 'Soumissions reçues', count: soumissionsRecues.length }, { id: 'comparatif', label: 'Comparatif' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-3 font-medium ${activeTab === tab.id ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-600'}`}>
            {tab.label} {tab.count !== undefined && <span className="bg-gray-100 text-xs px-2 py-0.5 rounded-full ml-1">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => setShowAddInvitation(true)} className="btn btn-secondary flex items-center gap-2"><Plus size={16} />Ajouter invitation</button></div>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50"><tr><th className="text-left p-3 text-sm">Entreprise</th><th className="text-left p-3 text-sm">Contact</th><th className="text-left p-3 text-sm">Email</th><th className="text-center p-3 text-sm">Statut</th><th className="text-center p-3 text-sm">Actions</th></tr></thead>
              <tbody className="divide-y">
                {invitations.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{inv.entreprise_nom}</td>
                    <td className="p-3 text-gray-600">{inv.contact_nom || '-'}</td>
                    <td className="p-3 text-gray-600">{inv.email || '-'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${inv.statut === 'soumis' ? 'bg-green-100 text-green-700' : inv.statut === 'envoye' ? 'bg-blue-100 text-blue-700' : inv.statut === 'decline' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{inv.statut}</span>
                    </td>
                    <td className="p-3 text-center"><button onClick={() => deleteInvitation(inv.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invitations.length === 0 && <div className="text-center py-8 text-gray-500">Aucune invitation</div>}
          </div>
        </div>
      )}

      {activeTab === 'soumissions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {soumissionsRecues.map((soum, idx) => (
            <div key={soum.id} className={`bg-white rounded-lg border p-4 ${soum.est_retenu ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{soum.entreprise_nom}</h3>
                  {soum.contact_nom && <p className="text-sm text-gray-500">{soum.contact_nom}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {idx === 0 && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Plus bas</span>}
                  {soum.est_retenu && <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-xs">Retenu</span>}
                </div>
              </div>
              <p className="text-2xl font-bold text-teal-600 mb-3">{soum.montant_total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
              <p className="text-sm text-gray-500 mb-3">Reçu le {new Date(soum.date_reception).toLocaleDateString('fr-CA')}</p>
              {!soum.est_retenu && <button onClick={() => retenirSoumission(soum.id)} className="btn btn-primary w-full text-sm"><Check size={16} className="mr-1" />Retenir cette soumission</button>}
            </div>
          ))}
          {soumissionsRecues.length === 0 && <div className="col-span-2 text-center py-12 text-gray-500"><DollarSign className="mx-auto mb-4 text-gray-300" size={48} /><p>Aucune soumission reçue</p></div>}
        </div>
      )}

      {activeTab === 'comparatif' && (
        <div className="bg-white rounded-lg border p-6">
          {soumissionsRecues.length >= 2 ? (
            <table className="w-full">
              <thead><tr className="border-b"><th className="text-left p-3">Entreprise</th><th className="text-right p-3">Montant</th><th className="text-center p-3">Écart vs min</th></tr></thead>
              <tbody>
                {soumissionsRecues.map((soum, idx) => {
                  const ecart = idx === 0 ? 0 : ((soum.montant_total - soumissionsRecues[0].montant_total) / soumissionsRecues[0].montant_total * 100)
                  return (
                    <tr key={soum.id} className="border-b">
                      <td className="p-3 font-medium">{soum.entreprise_nom} {soum.est_retenu && <span className="text-green-600 text-xs ml-2">✓ Retenu</span>}</td>
                      <td className="p-3 text-right font-bold">{soum.montant_total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                      <td className="p-3 text-center"><span className={`px-2 py-1 rounded text-sm ${ecart === 0 ? 'bg-green-100 text-green-700' : ecart < 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{ecart === 0 ? 'Le plus bas' : `+${ecart.toFixed(1)}%`}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500">Minimum 2 soumissions requises pour le comparatif</div>
          )}
        </div>
      )}

      {/* Modal ajout invitation */}
      {showAddInvitation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Ajouter une invitation</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Sélectionner depuis le bottin</label>
              <select onChange={(e) => handleSelectFromBottin(e.target.value)} className="input-field">
                <option value="">Choisir...</option>
                {individus.filter(i => i.type === 'sous_traitant' || i.type === 'fournisseur').map(i => (
                  <option key={i.id} value={i.id}>{i.prenom} {i.nom}</option>
                ))}
              </select>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-3">Ou saisir manuellement:</p>
              <form onSubmit={handleAddInvitation} className="space-y-3">
                <div><label className="block text-sm font-medium mb-1">Entreprise *</label><input type="text" required value={invitationForm.entreprise_nom} onChange={(e) => setInvitationForm({ ...invitationForm, entreprise_nom: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium mb-1">Contact</label><input type="text" value={invitationForm.contact_nom} onChange={(e) => setInvitationForm({ ...invitationForm, contact_nom: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={invitationForm.email} onChange={(e) => setInvitationForm({ ...invitationForm, email: e.target.value })} className="input-field" /></div>
                <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowAddInvitation(false)} className="btn btn-secondary">Annuler</button><button type="submit" className="btn btn-primary">Ajouter</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
