/**
 * DAST Solutions - Soumission Builder
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Plus, Trash2, Send, Copy, Download, ChevronDown, ChevronRight, DollarSign, Calculator } from 'lucide-react'
import { useSoumissions, useSoumissionDetail } from '@/hooks/useSoumissions'
import type { SoumissionV2 } from '@/types/modules'

export default function SoumissionsPage() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ client_nom: '', projet_nom: '' })
  const { soumissions, loading, createSoumission, deleteSoumission, dupliquerSoumission } = useSoumissions()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const soum = await createSoumission(formData)
    if (soum) navigate(`/soumissions-v2/${soum.id}`)
    setShowForm(false)
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'bg-gray-100 text-gray-700'
      case 'envoye': return 'bg-blue-100 text-blue-700'
      case 'accepte': return 'bg-green-100 text-green-700'
      case 'refuse': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-900">Soumissions V2</h1><p className="text-gray-600">Builder avec calculs automatiques</p></div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2"><Plus size={18} />Nouvelle soumission</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border"><p className="text-2xl font-bold text-gray-900">{soumissions.length}</p><p className="text-sm text-gray-500">Total</p></div>
        <div className="bg-white p-4 rounded-lg border"><p className="text-2xl font-bold text-blue-600">{soumissions.filter(s => s.soumission_statut === 'envoye').length}</p><p className="text-sm text-gray-500">En attente</p></div>
        <div className="bg-white p-4 rounded-lg border"><p className="text-2xl font-bold text-green-600">{soumissions.filter(s => s.soumission_statut === 'accepte').length}</p><p className="text-sm text-gray-500">Acceptées</p></div>
        <div className="bg-white p-4 rounded-lg border"><p className="text-2xl font-bold text-teal-600">{soumissions.reduce((sum, s) => sum + (s.total_avant_taxes || 0), 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}</p><p className="text-sm text-gray-500">Valeur totale</p></div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Numéro</th>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Client / Projet</th>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Date</th>
              <th className="text-right p-4 text-sm font-medium text-gray-600">Montant</th>
              <th className="text-center p-4 text-sm font-medium text-gray-600">Statut</th>
              <th className="text-center p-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {soumissions.map(soum => (
              <tr key={soum.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/soumissions-v2/${soum.id}`)}>
                <td className="p-4"><span className="font-mono font-medium text-teal-600">{soum.numero}</span></td>
                <td className="p-4"><p className="font-medium text-gray-900">{soum.client_nom || 'Sans client'}</p><p className="text-sm text-gray-500">{soum.projet_nom || 'Sans projet'}</p></td>
                <td className="p-4 text-sm text-gray-600">{new Date(soum.date_soumission).toLocaleDateString('fr-CA')}</td>
                <td className="p-4 text-right font-medium">{soum.total_avant_taxes?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }) || '0,00 $'}</td>
                <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs font-medium ${getStatutColor(soum.soumission_statut)}`}>{soum.soumission_statut}</span></td>
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => dupliquerSoumission(soum.id)} className="p-1 text-gray-400 hover:text-blue-600" title="Dupliquer"><Copy size={16} /></button>
                    <button onClick={() => { if(confirm('Supprimer?')) deleteSoumission(soum.id) }} className="p-1 text-gray-400 hover:text-red-600" title="Supprimer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {soumissions.length === 0 && <div className="text-center py-12 text-gray-500"><FileText className="mx-auto mb-4 text-gray-300" size={48} /><p>Aucune soumission créée</p></div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Nouvelle soumission</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nom du client</label><input type="text" value={formData.client_nom} onChange={(e) => setFormData({ ...formData, client_nom: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Nom du projet</label><input type="text" value={formData.projet_nom} onChange={(e) => setFormData({ ...formData, projet_nom: e.target.value })} className="input-field" /></div>
              <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Annuler</button><button type="submit" className="btn btn-primary">Créer</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export function SoumissionEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { soumission, sections, items, loading, createSection, updateSection, deleteSection, createItem, updateItem, deleteItem, updateMarges, recalculerTotaux } = useSoumissionDetail(id || '')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [editingMarges, setEditingMarges] = useState(false)
  const [marges, setMarges] = useState({ frais_generaux_pct: 0, administration_pct: 0, profit_pct: 0, contingence_pct: 0 })

  useEffect(() => {
    if (soumission) {
      setMarges({ frais_generaux_pct: soumission.frais_generaux_pct || 0, administration_pct: soumission.administration_pct || 0, profit_pct: soumission.profit_pct || 0, contingence_pct: soumission.contingence_pct || 0 })
      setExpandedSections(new Set(sections.map(s => s.id)))
    }
  }, [soumission, sections])

  const handleAddSection = async () => { const nom = prompt('Nom de la section:'); if (nom) await createSection({ nom }) }
  const handleSaveMarges = async () => { await updateMarges(marges); setEditingMarges(false) }

  if (loading || !soumission) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate('/soumissions-v2')} className="text-gray-400 hover:text-gray-600">←</button>
            <h1 className="text-2xl font-bold text-gray-900">{soumission.numero}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${soumission.soumission_statut === 'brouillon' ? 'bg-gray-100 text-gray-700' : soumission.soumission_statut === 'accepte' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{soumission.soumission_statut}</span>
          </div>
          <p className="text-gray-600">{soumission.client_nom} - {soumission.projet_nom}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary flex items-center gap-2"><Download size={18} />Exporter PDF</button>
          <button className="btn btn-primary flex items-center gap-2"><Send size={18} />Envoyer</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="flex justify-end"><button onClick={handleAddSection} className="btn btn-secondary flex items-center gap-2 text-sm"><Plus size={16} />Ajouter une section</button></div>
          {sections.map(section => (
            <div key={section.id} className="bg-white rounded-lg border overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer" onClick={() => { const newSet = new Set(expandedSections); expandedSections.has(section.id) ? newSet.delete(section.id) : newSet.add(section.id); setExpandedSections(newSet) }}>
                <div className="flex items-center gap-2">{expandedSections.has(section.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}<span className="font-semibold text-gray-900">{section.nom}</span></div>
                <div className="flex items-center gap-4"><span className="text-sm text-gray-500">M.O.: {section.sous_total_mo?.toFixed(2) || '0.00'} $</span><span className="text-sm text-gray-500">Mat.: {section.sous_total_materiaux?.toFixed(2) || '0.00'} $</span><span className="font-medium text-teal-600">{section.sous_total?.toFixed(2) || '0.00'} $</span></div>
              </div>
              {expandedSections.has(section.id) && (
                <div className="p-3">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2 w-8">#</th><th className="pb-2">Description</th><th className="pb-2 text-center w-16">Qté</th><th className="pb-2 text-center w-12">Unité</th><th className="pb-2 text-right w-24">M.O.</th><th className="pb-2 text-right w-24">Mat.</th><th className="pb-2 text-right w-24">Total</th><th className="pb-2 w-8"></th></tr></thead>
                    <tbody>
                      {items.filter(i => i.section_id === section.id).map((item, idx) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 text-gray-400">{idx + 1}</td>
                          <td className="py-2"><input type="text" value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} className="w-full bg-transparent border-0 focus:ring-0 p-0" /></td>
                          <td className="py-2 text-center"><input type="number" value={item.quantite} onChange={(e) => updateItem(item.id, { quantite: parseFloat(e.target.value) || 0 })} className="w-16 text-center bg-transparent border-0 focus:ring-1 focus:ring-teal-500 rounded" /></td>
                          <td className="py-2 text-center text-gray-500">{item.unite || '-'}</td>
                          <td className="py-2 text-right text-gray-600">{item.mo_cout_total?.toFixed(2) || '0.00'}</td>
                          <td className="py-2 text-right text-gray-600">{item.mat_cout_total?.toFixed(2) || '0.00'}</td>
                          <td className="py-2 text-right font-medium">{item.cout_total?.toFixed(2) || '0.00'}</td>
                          <td className="py-2"><button onClick={() => { if(confirm('Supprimer?')) deleteItem(item.id) }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => createItem({ section_id: section.id, description: 'Nouvel item', quantite: 0, unite: 'U', facteur_complexite: 1 })} className="mt-2 text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1"><Plus size={14} />Ajouter un item</button>
                  <div className="mt-3 pt-3 border-t flex justify-end"><button onClick={() => { if(confirm('Supprimer cette section?')) deleteSection(section.id) }} className="text-red-500 hover:text-red-700 text-xs">Supprimer section</button></div>
                </div>
              )}
            </div>
          ))}
          {sections.length === 0 && <div className="bg-white rounded-lg border p-8 text-center text-gray-500"><FileText className="mx-auto mb-4 text-gray-300" size={48} /><p>Ajoutez une section pour commencer</p></div>}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Main-d'œuvre</span><span>{soumission.sous_total_mo?.toFixed(2) || '0.00'} $</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Matériaux</span><span>{soumission.sous_total_materiaux?.toFixed(2) || '0.00'} $</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Équipements</span><span>{soumission.sous_total_equipements?.toFixed(2) || '0.00'} $</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Sous-traitants</span><span>{soumission.sous_total_sous_traitants?.toFixed(2) || '0.00'} $</span></div>
              <div className="flex justify-between font-medium border-t pt-2"><span>Coûts directs</span><span>{soumission.sous_total_direct?.toFixed(2) || '0.00'} $</span></div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-gray-900">Marges</h3><button onClick={() => setEditingMarges(!editingMarges)} className="text-teal-600 text-sm">{editingMarges ? 'Annuler' : 'Modifier'}</button></div>
            {editingMarges ? (
              <div className="space-y-3">
                <div><label className="text-xs text-gray-500">Frais généraux %</label><input type="number" step="0.1" value={marges.frais_generaux_pct} onChange={(e) => setMarges({ ...marges, frais_generaux_pct: parseFloat(e.target.value) || 0 })} className="input-field text-sm" /></div>
                <div><label className="text-xs text-gray-500">Administration %</label><input type="number" step="0.1" value={marges.administration_pct} onChange={(e) => setMarges({ ...marges, administration_pct: parseFloat(e.target.value) || 0 })} className="input-field text-sm" /></div>
                <div><label className="text-xs text-gray-500">Profit %</label><input type="number" step="0.1" value={marges.profit_pct} onChange={(e) => setMarges({ ...marges, profit_pct: parseFloat(e.target.value) || 0 })} className="input-field text-sm" /></div>
                <div><label className="text-xs text-gray-500">Contingence %</label><input type="number" step="0.1" value={marges.contingence_pct} onChange={(e) => setMarges({ ...marges, contingence_pct: parseFloat(e.target.value) || 0 })} className="input-field text-sm" /></div>
                <button onClick={handleSaveMarges} className="btn btn-primary w-full text-sm">Appliquer</button>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Frais gén. ({soumission.frais_generaux_pct || 0}%)</span><span>{soumission.frais_generaux_montant?.toFixed(2) || '0.00'} $</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Admin ({soumission.administration_pct || 0}%)</span><span>{soumission.administration_montant?.toFixed(2) || '0.00'} $</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Profit ({soumission.profit_pct || 0}%)</span><span>{soumission.profit_montant?.toFixed(2) || '0.00'} $</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Contingence ({soumission.contingence_pct || 0}%)</span><span>{soumission.contingence_montant?.toFixed(2) || '0.00'} $</span></div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-4 text-white">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Sous-total</span><span>{soumission.total_avant_taxes?.toFixed(2) || '0.00'} $</span></div>
              <div className="flex justify-between text-teal-100"><span>TPS (5%)</span><span>{soumission.tps?.toFixed(2) || '0.00'} $</span></div>
              <div className="flex justify-between text-teal-100"><span>TVQ (9.975%)</span><span>{soumission.tvq?.toFixed(2) || '0.00'} $</span></div>
              <div className="flex justify-between font-bold text-lg border-t border-teal-400 pt-2 mt-2"><span>TOTAL</span><span>{soumission.total_avec_taxes?.toFixed(2) || '0.00'} $</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
