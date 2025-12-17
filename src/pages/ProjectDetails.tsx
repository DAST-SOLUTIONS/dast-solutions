/**
 * DAST Solutions - Project Details avec KPIs et progression
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Loader2, MapPin, Calendar, DollarSign, User, FileText, Ruler, Receipt, ChevronRight, Trash2, Cloud, Calculator } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  { value: 'planning', label: 'Planification', color: 'bg-blue-100 text-blue-700' },
  { value: 'active', label: 'En cours', color: 'bg-green-100 text-green-700' },
  { value: 'on_hold', label: 'En pause', color: 'bg-amber-100 text-amber-700' },
  { value: 'completed', label: 'Terminé', color: 'bg-teal-100 text-teal-700' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-700' }
]

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const isNew = !projectId || projectId === 'new'

  const [project, setProject] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview')
  const [form, setForm] = useState({ name: '', client_name: '', address: '', city: '', province: 'QC', postal_code: '', description: '', status: 'draft', start_date: '', end_date: '', budget: '' })

  useEffect(() => {
    if (isNew) { setActiveTab('edit'); return }
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single()
      if (p) {
        setProject(p)
        setForm({ name: p.name || '', client_name: p.client_name || '', address: p.address || '', city: p.city || '', province: p.province || 'QC', postal_code: p.postal_code || '', description: p.description || '', status: p.status || 'draft', start_date: p.start_date || '', end_date: p.end_date || '', budget: p.budget?.toString() || '' })
      }
      const [soumRes, factRes, measRes] = await Promise.all([
        supabase.from('soumissions').select('id, status, total').eq('project_id', projectId),
        supabase.from('factures').select('id, status, total, balance_due').eq('project_id', projectId),
        supabase.from('takeoff_measures').select('id').eq('project_id', projectId)
      ])
      const soum = soumRes.data || [], fact = factRes.data || [], meas = measRes.data || []
      setStats({
        soumissions: soum.length, soumissionsAccepted: soum.filter(s => s.status === 'accepted').length,
        factures: fact.length, facturesUnpaid: fact.filter(f => f.status !== 'paid').length,
        measures: meas.length, totalRevenue: fact.reduce((sum, f) => sum + (f.total - (f.balance_due || 0)), 0)
      })
      setLoading(false)
    }
    load()
  }, [projectId, isNew])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const projectData = { ...form, budget: form.budget ? parseFloat(form.budget) : null, updated_at: new Date().toISOString() }
    if (isNew) {
      const { data } = await supabase.from('projects').insert({ ...projectData, user_id: user.id }).select().single()
      if (data) navigate(`/project/${data.id}`)
    } else {
      await supabase.from('projects').update(projectData).eq('id', projectId)
      setProject({ ...project, ...projectData })
      setActiveTab('overview')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce projet?')) return
    await supabase.from('projects').delete().eq('id', projectId)
    navigate('/dashboard')
  }

  const statusConfig = STATUS_OPTIONS.find(s => s.value === project?.status) || STATUS_OPTIONS[0]

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600" size={40} /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold">{isNew ? 'Nouveau projet' : project?.name}</h1>
            {!isNew && project && (
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig.color}`}>{statusConfig.label}</span>
                {project.client_name && <span className="text-sm text-gray-500"><User size={14} className="inline mr-1" />{project.client_name}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && activeTab === 'overview' && <button onClick={() => setActiveTab('edit')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Modifier</button>}
          {(isNew || activeTab === 'edit') && <button onClick={handleSave} disabled={saving || !form.name} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">{saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}<span>{isNew ? 'Créer' : 'Enregistrer'}</span></button>}
        </div>
      </div>

      {!isNew && activeTab === 'overview' && project && stats && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><FileText className="text-blue-600" size={24} /></div>
                <div><p className="text-2xl font-bold">{stats.soumissions}</p><p className="text-sm text-gray-500">Soumissions</p></div>
              </div>
              {stats.soumissionsAccepted > 0 && <p className="text-xs mt-2 text-green-600">{stats.soumissionsAccepted} acceptée(s)</p>}
            </div>
            <div className="bg-white rounded-xl p-5 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center"><Receipt className="text-teal-600" size={24} /></div>
                <div><p className="text-2xl font-bold">{stats.factures}</p><p className="text-sm text-gray-500">Factures</p></div>
              </div>
              {stats.facturesUnpaid > 0 && <p className="text-xs mt-2 text-amber-600">{stats.facturesUnpaid} impayée(s)</p>}
            </div>
            <div className="bg-white rounded-xl p-5 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><Ruler className="text-purple-600" size={24} /></div>
                <div><p className="text-2xl font-bold">{stats.measures}</p><p className="text-sm text-gray-500">Mesures</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><DollarSign className="text-green-600" size={24} /></div>
                <div><p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}</p><p className="text-sm text-gray-500">Revenus</p></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <button onClick={() => navigate(`/takeoff/${projectId}`)} className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition"><Ruler className="text-white" size={28} /></div>
              <h3 className="font-semibold">Takeoff</h3>
              <p className="text-sm text-gray-500 mt-1">Relevé de quantités</p>
              <ChevronRight className="text-gray-400 mt-3" size={18} />
            </button>
            <button onClick={() => navigate(`/bid-proposal/${projectId}`)} className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition"><FileText className="text-white" size={28} /></div>
              <h3 className="font-semibold">Soumission</h3>
              <p className="text-sm text-gray-500 mt-1">Créer une soumission</p>
              <ChevronRight className="text-gray-400 mt-3" size={18} />
            </button>
            <button onClick={() => navigate(`/project-costs/${projectId}`)} className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition"><Calculator className="text-white" size={28} /></div>
              <h3 className="font-semibold">Estimation</h3>
              <p className="text-sm text-gray-500 mt-1">Coûts et main-d'œuvre</p>
              <ChevronRight className="text-gray-400 mt-3" size={18} />
            </button>
            <button onClick={() => navigate(`/cloud-storage/${projectId}`)} className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition"><Cloud className="text-white" size={28} /></div>
              <h3 className="font-semibold">Documents</h3>
              <p className="text-sm text-gray-500 mt-1">Plans et fichiers</p>
              <ChevronRight className="text-gray-400 mt-3" size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Informations du projet</h3>
              <div className="grid grid-cols-2 gap-4">
                {project.address && <div className="flex items-start gap-3"><MapPin className="text-gray-400 mt-0.5" size={18} /><div><p className="text-sm text-gray-500">Adresse</p><p className="font-medium">{project.address}</p>{project.city && <p className="text-sm text-gray-600">{project.city}, {project.province}</p>}</div></div>}
                {project.start_date && <div className="flex items-start gap-3"><Calendar className="text-gray-400 mt-0.5" size={18} /><div><p className="text-sm text-gray-500">Dates</p><p className="font-medium">{new Date(project.start_date).toLocaleDateString('fr-CA')}{project.end_date && ` → ${new Date(project.end_date).toLocaleDateString('fr-CA')}`}</p></div></div>}
                {project.budget && <div className="flex items-start gap-3"><DollarSign className="text-gray-400 mt-0.5" size={18} /><div><p className="text-sm text-gray-500">Budget</p><p className="font-medium">{project.budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p></div></div>}
              </div>
              {project.description && <div className="mt-4 pt-4 border-t"><p className="text-sm text-gray-500 mb-1">Description</p><p className="text-gray-700">{project.description}</p></div>}
            </div>
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Progression</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Soumissions acceptées</span><span className="font-medium">{stats.soumissions > 0 ? Math.round((stats.soumissionsAccepted / stats.soumissions) * 100) : 0}%</span></div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.soumissions > 0 ? Math.round((stats.soumissionsAccepted / stats.soumissions) * 100) : 0}%` }} /></div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Factures payées</span><span className="font-medium">{stats.factures > 0 ? Math.round(((stats.factures - stats.facturesUnpaid) / stats.factures) * 100) : 0}%</span></div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-teal-500 rounded-full" style={{ width: `${stats.factures > 0 ? Math.round(((stats.factures - stats.facturesUnpaid) / stats.factures) * 100) : 0}%` }} /></div>
              </div>
              <div className="mt-6 pt-4 border-t">
                <button onClick={handleDelete} className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm flex items-center justify-center gap-2"><Trash2 size={16} />Supprimer le projet</button>
              </div>
            </div>
          </div>
        </>
      )}

      {(isNew || activeTab === 'edit') && (
        <div className="bg-white rounded-xl border p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Nom du projet *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: Rénovation cuisine" required /></div>
            <div><label className="block text-sm font-medium mb-1">Client</label><input type="text" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Statut</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2 border rounded-lg">{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Adresse</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Ville</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Province</label><select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full px-4 py-2 border rounded-lg"><option value="QC">Québec</option><option value="ON">Ontario</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Code postal</label><input type="text" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Date début</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Date fin</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Budget</label><input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={4} /></div>
          </div>
        </div>
      )}
    </div>
  )
}