/**
 * DAST Solutions - Soumission V2 avec PDF professionnel
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { downloadSoumissionPDF, openSoumissionPDF } from '@/services/pdfSoumissionService'
import SignatureCanvas from '@/components/SignatureCanvas'
import { ArrowLeft, Save, FileText, Plus, Trash2, Eye, Download, Loader2, Check, ChevronDown, ChevronUp, User, Calculator } from 'lucide-react'

interface LineItem { id: string; description: string; category: string; quantity: number; unit: string; unitPrice: number; total: number }

const DEFAULT_CONDITIONS = ['Prix valide pour 30 jours', 'Travaux selon les règles de l\'art', 'Permis non inclus sauf mention', 'Paiement: 50% début, 50% fin', 'Garantie légale sur travaux']
const DEFAULT_EXCLUSIONS = ['Démolition et disposition débris', 'Réparation dommages cachés', 'Travaux électriques majeurs', 'Travaux plomberie majeurs']

export default function BidProposalV2() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fromTakeoff = searchParams.get('from') === 'takeoff'

  const [project, setProject] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [soumission, setSoumission] = useState<any>({
    project_id: projectId, soumission_number: '', client_name: '', client_email: '', client_phone: '', client_address: '',
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'draft',
    items: [] as LineItem[], subtotal: 0, tps: 0, tvq: 0, total: 0, conditions: DEFAULT_CONDITIONS, exclusions: DEFAULT_EXCLUSIONS, notes: ''
  })
  const [showConditions, setShowConditions] = useState(false)
  const [showExclusions, setShowExclusions] = useState(false)
  const [showSignature, setShowSignature] = useState(false)
  const [newCondition, setNewCondition] = useState('')
  const [newExclusion, setNewExclusion] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
      setUserProfile(profile)
      const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).single()
      setProject(proj)
      const { count } = await supabase.from('soumissions').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      const soumNum = `SOU-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

      let items: LineItem[] = []
      if (fromTakeoff) {
        const tm = sessionStorage.getItem('takeoff_measures')
        const tl = sessionStorage.getItem('takeoff_labor')
        if (tm) { const m = JSON.parse(tm); items = m.map((x: any, i: number) => ({ id: `item-${i}`, description: x.label || `Mesure ${i+1}`, category: x.category || '', quantity: x.value, unit: x.unit, unitPrice: x.unit_price || 0, total: x.total_price || 0 })) }
        if (tl && parseFloat(tl) > 0) { items.push({ id: `labor-${Date.now()}`, description: 'Main-d\'œuvre CCQ', category: 'MO', quantity: 1, unit: 'forfait', unitPrice: parseFloat(tl), total: parseFloat(tl) }) }
        sessionStorage.removeItem('takeoff_measures'); sessionStorage.removeItem('takeoff_labor')
      }
      const subtotal = items.reduce((s, i) => s + i.total, 0), tps = subtotal * 0.05, tvq = subtotal * 0.09975
      setSoumission((p: any) => ({ ...p, soumission_number: soumNum, client_name: proj?.client_name || '', items, subtotal, tps, tvq, total: subtotal + tps + tvq }))
      setLoading(false)
    }
    load()
  }, [projectId, fromTakeoff])

  const recalc = (items: LineItem[]) => {
    const subtotal = items.reduce((s, i) => s + i.total, 0), tps = subtotal * 0.05, tvq = subtotal * 0.09975
    setSoumission((p: any) => ({ ...p, items, subtotal, tps, tvq, total: subtotal + tps + tvq }))
  }

  const addItem = () => { setSoumission((p: any) => ({ ...p, items: [...p.items, { id: `item-${Date.now()}`, description: '', category: '', quantity: 1, unit: 'unité', unitPrice: 0, total: 0 }] })) }
  const updateItem = (id: string, field: string, value: any) => {
    const items = soumission.items.map((i: LineItem) => {
      if (i.id !== id) return i
      const u = { ...i, [field]: value }
      if (field === 'quantity' || field === 'unitPrice') u.total = u.quantity * u.unitPrice
      return u
    })
    recalc(items)
  }
  const deleteItem = (id: string) => { recalc(soumission.items.filter((i: LineItem) => i.id !== id)) }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const data = { user_id: user.id, project_id: projectId, ...soumission }
    if (soumission.id) { await supabase.from('soumissions').update(data).eq('id', soumission.id) }
    else { const { data: d } = await supabase.from('soumissions').insert(data).select().single(); if (d) setSoumission((p: any) => ({ ...p, id: d.id })) }
    alert('Enregistré!'); setSaving(false)
  }

  const getPDFData = () => ({
    entreprise: { name: userProfile?.company_name || 'Mon Entreprise', address: userProfile?.address, city: userProfile?.city, phone: userProfile?.phone, email: userProfile?.email, rbq: userProfile?.rbq_number },
    soumission: { number: soumission.soumission_number, date: new Date().toISOString(), validUntil: soumission.valid_until },
    client: { name: soumission.client_name, address: soumission.client_address, email: soumission.client_email, phone: soumission.client_phone },
    project: { name: project?.name || '', address: project?.address, description: project?.description },
    items: soumission.items.map((i: LineItem) => ({ description: i.description, category: i.category, quantity: i.quantity, unit: i.unit, unitPrice: i.unitPrice, total: i.total })),
    subtotal: soumission.subtotal, tps: soumission.tps, tvq: soumission.tvq, total: soumission.total,
    conditions: soumission.conditions, exclusions: soumission.exclusions, notes: soumission.notes,
    signature: soumission.signature_name ? { name: soumission.signature_name, date: new Date().toISOString(), image: soumission.signature_image } : undefined
  })

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600" size={40} /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/project/${projectId}`)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold">Nouvelle soumission</h1><p className="text-gray-500">{project?.name}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openSoumissionPDF(getPDFData())} className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"><Eye size={16} />Aperçu</button>
          <button onClick={() => downloadSoumissionPDF(getPDFData())} className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"><Download size={16} />PDF</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">{saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}Enregistrer</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Client */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><User size={18} />Client</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Nom *</label><input type="text" value={soumission.client_name} onChange={(e) => setSoumission((p: any) => ({ ...p, client_name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={soumission.client_email} onChange={(e) => setSoumission((p: any) => ({ ...p, client_email: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Téléphone</label><input type="tel" value={soumission.client_phone} onChange={(e) => setSoumission((p: any) => ({ ...p, client_phone: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Adresse</label><input type="text" value={soumission.client_address} onChange={(e) => setSoumission((p: any) => ({ ...p, client_address: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between mb-4"><h2 className="font-semibold flex items-center gap-2"><Calculator size={18} />Items</h2><button onClick={addItem} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1"><Plus size={16} />Ajouter</button></div>
            {soumission.items.length === 0 ? <div className="text-center py-8 text-gray-500"><FileText className="mx-auto mb-2" size={32} /><p>Aucun item</p></div> : (
              <div className="space-y-3">
                {soumission.items.map((item: LineItem) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-4"><input type="text" placeholder="Description" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm" /></div>
                    <div className="col-span-2"><input type="number" placeholder="Qté" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border rounded text-sm" /></div>
                    <div className="col-span-1"><input type="text" placeholder="Unité" value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm" /></div>
                    <div className="col-span-2"><input type="number" placeholder="Prix" value={item.unitPrice || ''} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border rounded text-sm" /></div>
                    <div className="col-span-2 text-right font-medium text-sm py-1.5">{item.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
                    <div className="col-span-1 text-right"><button onClick={() => deleteItem(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <button onClick={() => setShowConditions(!showConditions)} className="w-full px-6 py-4 flex justify-between hover:bg-gray-50"><h2 className="font-semibold">Conditions ({soumission.conditions.length})</h2>{showConditions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
            {showConditions && <div className="px-6 pb-4 space-y-2">
              {soumission.conditions.map((c: string, i: number) => <div key={i} className="flex items-center gap-2"><span className="flex-1 text-sm text-gray-600">• {c}</span><button onClick={() => setSoumission((p: any) => ({ ...p, conditions: p.conditions.filter((_: any, j: number) => j !== i) }))} className="text-red-500 text-xs">×</button></div>)}
              <div className="flex gap-2 mt-2"><input type="text" value={newCondition} onChange={(e) => setNewCondition(e.target.value)} placeholder="Nouvelle condition..." className="flex-1 px-3 py-2 border rounded-lg text-sm" /><button onClick={() => { if (newCondition.trim()) { setSoumission((p: any) => ({ ...p, conditions: [...p.conditions, newCondition.trim()] })); setNewCondition('') } }} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Ajouter</button></div>
            </div>}
          </div>

          {/* Exclusions */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <button onClick={() => setShowExclusions(!showExclusions)} className="w-full px-6 py-4 flex justify-between hover:bg-gray-50"><h2 className="font-semibold">Exclusions ({soumission.exclusions.length})</h2>{showExclusions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
            {showExclusions && <div className="px-6 pb-4 space-y-2">
              {soumission.exclusions.map((e: string, i: number) => <div key={i} className="flex items-center gap-2"><span className="flex-1 text-sm text-gray-600">• {e}</span><button onClick={() => setSoumission((p: any) => ({ ...p, exclusions: p.exclusions.filter((_: any, j: number) => j !== i) }))} className="text-red-500 text-xs">×</button></div>)}
              <div className="flex gap-2 mt-2"><input type="text" value={newExclusion} onChange={(e) => setNewExclusion(e.target.value)} placeholder="Nouvelle exclusion..." className="flex-1 px-3 py-2 border rounded-lg text-sm" /><button onClick={() => { if (newExclusion.trim()) { setSoumission((p: any) => ({ ...p, exclusions: [...p.exclusions, newExclusion.trim()] })); setNewExclusion('') } }} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Ajouter</button></div>
            </div>}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Notes</h2>
            <textarea value={soumission.notes} onChange={(e) => setSoumission((p: any) => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" rows={4} placeholder="Notes additionnelles..." />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Sommaire</h2>
            <div className="space-y-3 mb-4">
              <div><label className="block text-sm text-gray-500 mb-1">Numéro</label><p className="font-mono font-bold text-lg">{soumission.soumission_number}</p></div>
              <div><label className="block text-sm text-gray-500 mb-1">Valide jusqu'au</label><input type="date" value={soumission.valid_until} onChange={(e) => setSoumission((p: any) => ({ ...p, valid_until: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Sous-total</span><span>{soumission.subtotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">TPS (5%)</span><span>{soumission.tps.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">TVQ (9.975%)</span><span>{soumission.tvq.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span></div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t"><span>Total</span><span className="text-teal-600">{soumission.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Signature</h2>
            {!showSignature ? <button onClick={() => setShowSignature(true)} className="w-full py-3 border-2 border-dashed rounded-lg text-gray-500 hover:border-teal-400">Ajouter signature</button> : (
              <div className="space-y-3">
                <input type="text" placeholder="Nom du signataire" value={soumission.signature_name || ''} onChange={(e) => setSoumission((p: any) => ({ ...p, signature_name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                <SignatureCanvas onSave={(sig: string) => setSoumission((p: any) => ({ ...p, signature_image: sig }))} width={250} height={100} />
                {soumission.signature_image && <div className="text-center"><Check className="inline text-green-500" size={16} /><span className="text-sm text-green-600 ml-1">Signature enregistrée</span></div>}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <button onClick={() => openSoumissionPDF(getPDFData())} className="w-full py-2 bg-white/20 rounded-lg hover:bg-white/30 flex items-center justify-center gap-2"><Eye size={16} />Aperçu PDF</button>
              <button onClick={() => downloadSoumissionPDF(getPDFData())} className="w-full py-2 bg-white/20 rounded-lg hover:bg-white/30 flex items-center justify-center gap-2"><Download size={16} />Télécharger PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}