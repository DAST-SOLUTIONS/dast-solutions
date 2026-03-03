/**
 * DAST Solutions - AI Takeoff Module
 * Analyse réelle des plans via Claude Vision API
 * Partage les plans avec TakeoffV3 via Supabase takeoff_plans
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Brain, Upload, FileText, CheckCircle, AlertTriangle,
  Download, Play, Layers, Ruler, Square, Hash,
  Sparkles, ArrowLeft, Loader2, X, Plus, RefreshCw, Box
} from 'lucide-react'
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalysisResult {
  id: string
  type: 'surface' | 'lineaire' | 'comptage' | 'volume'
  element: string
  quantite: number
  unite: string
  confiance: number
  page: number
  zone?: string
  categorie?: string
}

interface Plan {
  id: string
  filename: string
  original_name?: string
  file_url?: string
  storage_path?: string
  status: 'idle' | 'analyzing' | 'done' | 'error'
  results?: AnalysisResult[]
  error?: string
}

const CATEGORIES_CONSTRUCTION = [
  'Béton', 'Maçonnerie', 'Charpente bois', 'Acier structural',
  'Toiture', 'Isolation', 'Fenestration', 'Cloisons', 'Finitions intérieures',
  'Plomberie', 'CVAC', 'Électricité', 'Excavation', 'Aménagement extérieur'
]

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AITakeoffModule() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<'auto' | 'guided'>('auto')
  const [guidedElements, setGuidedElements] = useState<string[]>([])
  const [newElement, setNewElement] = useState('')
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Chargement des plans depuis Supabase (partagés avec TakeoffV3) ──────────
  useEffect(() => {
    if (projectId) loadData()
  }, [projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger le projet
      const { data: proj } = await supabase
        .from('projects').select('*').eq('id', projectId).single()
      setProject(proj)

      // Charger les plans depuis takeoff_plans (même table que TakeoffV3)
      const { data: plansData } = await supabase
        .from('takeoff_plans')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('sort_order')

      if (plansData?.length) {
        const withUrls = plansData.map(p => {
          let url = p.file_url
          if (!url && p.storage_path) {
            const { data: u } = supabase.storage.from('takeoff-plans').getPublicUrl(p.storage_path)
            url = u?.publicUrl
          }
          return {
            id: p.id,
            filename: p.filename || p.original_name || 'Plan',
            original_name: p.original_name,
            file_url: url,
            storage_path: p.storage_path,
            status: 'idle' as const,
            results: undefined
          }
        })
        setPlans(withUrls)
        if (withUrls.length > 0) setSelectedPlanId(withUrls[0].id)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ── Upload d'un nouveau plan (aussi sauvé dans takeoff_plans) ──────────────
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !projectId) return
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

    for (const file of Array.from(files)) {
      const tempId = crypto.randomUUID()
      const newPlan: Plan = {
        id: tempId,
        filename: file.name,
        status: 'idle'
      }
      setPlans(prev => [...prev, newPlan])

      try {
        let fileUrl = URL.createObjectURL(file)
        let storagePath = ''

        if (user) {
          // Upload dans Supabase Storage
          storagePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`
          const { error: upErr } = await supabase.storage
            .from('takeoff-plans').upload(storagePath, file)

          if (!upErr) {
            const { data: u } = supabase.storage.from('takeoff-plans').getPublicUrl(storagePath)
            fileUrl = u.publicUrl
            // Sauvegarder dans takeoff_plans (partagé avec TakeoffV3)
            const { data: saved } = await supabase.from('takeoff_plans').insert({
              project_id: projectId,
              user_id: user.id,
              filename: file.name,
              original_name: file.name,
              storage_path: storagePath,
              file_url: fileUrl,
              file_type: 'pdf',
              sort_order: plans.length
            }).select().single()

            if (saved) {
              setPlans(prev => prev.map(p =>
                p.id === tempId ? { ...p, id: saved.id, file_url: fileUrl } : p
              ))
              setSelectedPlanId(saved.id)
              continue
            }
          }
        }

        setPlans(prev => prev.map(p =>
          p.id === tempId ? { ...p, file_url: fileUrl } : p
        ))
        setSelectedPlanId(tempId)
      } catch (e) {
        console.error(e)
        setPlans(prev => prev.map(p =>
          p.id === tempId ? { ...p, status: 'error', error: 'Erreur upload' } : p
        ))
      }
    }
  }

  // ── Convertir PDF page en base64 image via canvas ──────────────────────────
  const pdfPageToBase64 = async (fileUrl: string, pageNum: number = 1): Promise<string | null> => {
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs', import.meta.url
      ).toString()
      const pdf = await pdfjsLib.getDocument(fileUrl).promise
      const page = await pdf.getPage(Math.min(pageNum, pdf.numPages))
      const vp = page.getViewport({ scale: 1.5 })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width
      canvas.height = vp.height
      await page.render({ canvasContext: canvas.getContext('2d') as any, viewport: vp } as any).promise
      // Réduire la taille pour l'API (max ~1MB)
      const resized = document.createElement('canvas')
      const maxW = 1200
      const ratio = Math.min(maxW / canvas.width, 1)
      resized.width = canvas.width * ratio
      resized.height = canvas.height * ratio
      const rctx = resized.getContext('2d')!
      rctx.drawImage(canvas, 0, 0, resized.width, resized.height)
      return resized.toDataURL('image/jpeg', 0.85).split(',')[1]
    } catch (e) {
      console.error('PDF to image error:', e)
      return null
    }
  }

  // ── Appel réel à Claude Vision via Anthropic API ───────────────────────────
  const analyzeWithClaude = async (plan: Plan): Promise<AnalysisResult[]> => {
    if (!plan.file_url) throw new Error('Aucun fichier URL disponible')

    const imageBase64 = await pdfPageToBase64(plan.file_url, 1)
    if (!imageBase64) throw new Error('Impossible de convertir le PDF en image')

    const systemPrompt = `Tu es un expert en estimation construction au Québec. 
Tu analyses des plans de construction pour extraire les quantités.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans explication.
Format requis: tableau d'objets avec les champs:
- element: nom de l'élément (string)
- type: "surface" | "lineaire" | "comptage" | "volume"  
- quantite: nombre (float)
- unite: unité de mesure (m², m, unités, m³)
- confiance: score 0-100
- zone: zone ou niveau du plan (string)
- categorie: catégorie CSI (string)`

    const userPrompt = analysisMode === 'guided' && guidedElements.length > 0
      ? `Analyse ce plan de construction et trouve ces éléments spécifiques: ${guidedElements.join(', ')}. 
         Extrait les quantités pour chacun. Si un élément n'est pas visible, ne l'inclus pas.
         Retourne un tableau JSON.`
      : `Analyse ce plan de construction et identifie tous les éléments quantifiables.
         Cherche: surfaces (dalles, murs, toitures), linéaires (fondations, poutres, gouttières), 
         comptages (portes, fenêtres, colonnes), volumes (béton, remblai).
         Retourne un tableau JSON avec toutes les quantités trouvées.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 }
            },
            { type: 'text', text: userPrompt }
          ]
        }]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`API error ${response.status}: ${err}`)
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || '[]'

    // Parse JSON response
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return parsed.map((item: any, i: number) => ({
      id: crypto.randomUUID(),
      type: item.type || 'surface',
      element: item.element || `Élément ${i+1}`,
      quantite: parseFloat(item.quantite) || 0,
      unite: item.unite || 'm²',
      confiance: parseInt(item.confiance) || 85,
      page: 1,
      zone: item.zone || '',
      categorie: item.categorie || 'Autre'
    }))
  }

  // ── Lancer l'analyse ────────────────────────────────────────────────────────
  const startAnalysis = async () => {
    const toAnalyze = selectedPlanId
      ? plans.filter(p => p.id === selectedPlanId)
      : plans

    if (!toAnalyze.length) return
    setIsAnalyzing(true)

    for (const plan of toAnalyze) {
      setPlans(prev => prev.map(p =>
        p.id === plan.id ? { ...p, status: 'analyzing', error: undefined } : p
      ))
      try {
        const results = await analyzeWithClaude(plan)
        setPlans(prev => prev.map(p =>
          p.id === plan.id ? { ...p, status: 'done', results } : p
        ))
      } catch (e: any) {
        console.error('Analysis error:', e)
        setPlans(prev => prev.map(p =>
          p.id === plan.id ? { ...p, status: 'error', error: e.message } : p
        ))
      }
    }
    setIsAnalyzing(false)
  }

  // ── Export Excel ────────────────────────────────────────────────────────────
  const exportExcel = () => {
    const allResults = plans.flatMap(p =>
      (p.results || []).map(r => ({
        'Plan': p.filename,
        'Élément': r.element,
        'Catégorie': r.categorie || '',
        'Type': r.type,
        'Quantité': r.quantite,
        'Unité': r.unite,
        'Zone': r.zone || '',
        'Page': r.page,
        'Confiance': `${r.confiance}%`
      }))
    )
    if (!allResults.length) return
    const ws = XLSX.utils.json_to_sheet(allResults)
    ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 6 }, { wch: 10 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'AI Takeoff')
    XLSX.writeFile(wb, `ai_takeoff_${project?.name || 'export'}.xlsx`)
  }

  // ── Transférer vers TakeoffV3 ────────────────────────────────────────────
  const transferToTakeoff = async () => {
    if (!projectId) return
    const allResults = plans.flatMap(p => p.results || [])
    if (!allResults.length) return

    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
    if (!user) { alert('Connexion requise'); return }

    for (const r of allResults) {
      await supabase.from('takeoff_items').insert({
        project_id: projectId,
        user_id: user.id,
        category: r.categorie || r.type,
        description: r.element,
        measurement_type: r.type === 'comptage' ? 'count' : r.type === 'lineaire' ? 'linear' : 'area',
        quantity: r.quantite,
        unit: r.unite,
        color: '#8B5CF6',
        points: []
      }).catch(console.error)
    }
    alert(`✅ ${allResults.length} éléments transférés vers le Takeoff`)
    navigate(`/takeoff/${projectId}`)
  }

  // ── Helpers UI ──────────────────────────────────────────────────────────────
  const selectedPlan = plans.find(p => p.id === selectedPlanId)
  const allResults = selectedPlan?.results || []
  const totalPlans = plans.length
  const analyzedPlans = plans.filter(p => p.status === 'done').length
  const totalElements = plans.flatMap(p => p.results || []).length
  const avgConfiance = totalElements > 0
    ? Math.round(plans.flatMap(p => p.results || []).reduce((s, r) => s + r.confiance, 0) / totalElements)
    : 0

  const typeIcon = (type: string) => {
    switch (type) {
      case 'surface': return <Square size={14} className="text-blue-500" />
      case 'lineaire': return <Ruler size={14} className="text-green-500" />
      case 'comptage': return <Hash size={14} className="text-purple-500" />
      case 'volume': return <Box size={14} className="text-orange-500" />
      default: return <Square size={14} className="text-gray-400" />
    }
  }

  const confColor = (c: number) =>
    c >= 90 ? 'text-green-600 bg-green-50' : c >= 75 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(projectId ? `/takeoff/${projectId}` : '/takeoff')}
            className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">AI Takeoff Automatique</h1>
            <p className="text-xs text-gray-500">
              {project?.name || 'Chargement...'} · Analyse par Claude Vision
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalElements > 0 && (
            <>
              <button onClick={exportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
                <Download size={14} /> Excel
              </button>
              <button onClick={transferToTakeoff}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-500">
                <CheckCircle size={14} /> Valider et transférer au Takeoff
              </button>
            </>
          )}
          <button
            onClick={startAnalysis}
            disabled={isAnalyzing || plans.filter(p => p.status === 'idle' || p.status === 'error').length === 0}
            className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500 disabled:opacity-40"
          >
            {isAnalyzing
              ? <><Loader2 size={14} className="animate-spin" /> Analyse en cours...</>
              : <><Sparkles size={14} /> Lancer l'analyse</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4">
        {[
          { label: 'Plans chargés', value: totalPlans, sub: `${analyzedPlans} analysés`, color: 'blue' },
          { label: 'Éléments détectés', value: totalElements, sub: 'au total', color: 'purple' },
          { label: 'Confiance moyenne', value: avgConfiance ? `${avgConfiance}%` : '—', sub: '', color: 'green' },
          { label: 'Statut', value: isAnalyzing ? 'En cours...' : analyzedPlans > 0 ? 'Complété' : 'En attente', sub: '', color: 'gray' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="px-6 pb-6 grid grid-cols-3 gap-5">
        {/* Panneau gauche: plans + config */}
        <div className="space-y-4">
          {/* Upload */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Layers size={16} className="text-purple-500" /> Plans
              {loading && <Loader2 size={14} className="animate-spin text-gray-400 ml-auto" />}
              {!loading && (
                <button onClick={loadData} className="ml-auto text-gray-400 hover:text-gray-600">
                  <RefreshCw size={14} />
                </button>
              )}
            </h3>

            {/* Zone upload */}
            <label
              className="block border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors mb-3"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files) }}
            >
              <Upload size={20} className="mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Glissez un PDF ici</p>
              <p className="text-[10px] text-gray-400 mt-0.5">PDF, DWG, DXF, IFC, RVT</p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.dwg,.dxf,.ifc,.rvt"
                className="hidden" onChange={e => handleFileUpload(e.target.files)} />
            </label>

            {plans.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">
                {loading ? 'Chargement...' : 'Aucun plan · Les plans du Takeoff apparaissent ici automatiquement'}
              </p>
            ) : (
              <div className="space-y-1.5">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      selectedPlanId === plan.id ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <FileText size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="flex-1 truncate font-medium">{plan.filename}</span>
                    {plan.status === 'analyzing' && <Loader2 size={12} className="animate-spin text-purple-500 flex-shrink-0" />}
                    {plan.status === 'done' && <CheckCircle size={12} className="text-green-500 flex-shrink-0" />}
                    {plan.status === 'error' && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mode d'analyse */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-sm mb-3">Mode d'analyse</h3>
            <div className="space-y-2">
              {[
                { id: 'auto', label: 'Automatique', sub: "L'IA détecte tous les éléments" },
                { id: 'guided', label: 'Guidé', sub: 'Spécifiez les éléments à chercher' }
              ].map(m => (
                <label key={m.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  analysisMode === m.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="mode" value={m.id} checked={analysisMode === m.id as any}
                    onChange={() => setAnalysisMode(m.id as 'auto' | 'guided')} className="mt-0.5 accent-purple-600" />
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.sub}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Éléments guidés */}
            {analysisMode === 'guided' && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-600">Éléments à chercher :</p>
                <div className="flex gap-1.5">
                  <input
                    value={newElement}
                    onChange={e => setNewElement(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newElement.trim()) {
                        setGuidedElements(prev => [...prev, newElement.trim()])
                        setNewElement('')
                      }
                    }}
                    placeholder="Ex: dalle béton..."
                    className="flex-1 text-xs border rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-purple-400"
                  />
                  <button
                    onClick={() => { if (newElement.trim()) { setGuidedElements(prev => [...prev, newElement.trim()]); setNewElement('') } }}
                    className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-500">
                    <Plus size={14} />
                  </button>
                </div>
                {/* Quick-add catégories */}
                <div className="flex flex-wrap gap-1">
                  {CATEGORIES_CONSTRUCTION.slice(0, 6).map(c => (
                    <button key={c} onClick={() => !guidedElements.includes(c) && setGuidedElements(prev => [...prev, c])}
                      className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-purple-100 rounded-full border">
                      + {c}
                    </button>
                  ))}
                </div>
                {guidedElements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {guidedElements.map(el => (
                      <span key={el} className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {el}
                        <button onClick={() => setGuidedElements(prev => prev.filter(e => e !== el))}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panneau central: résultats */}
        <div className="col-span-2 bg-white rounded-xl border">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">
              {selectedPlan ? `Résultats — ${selectedPlan.filename}` : 'Résultats de l\'analyse'}
            </h3>
            {allResults.length > 0 && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {allResults.length} éléments
              </span>
            )}
          </div>

          {/* Empty states */}
          {!selectedPlan && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Brain size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Sélectionnez un plan et lancez l'analyse</p>
            </div>
          )}

          {selectedPlan?.status === 'analyzing' && (
            <div className="flex flex-col items-center justify-center h-64 text-purple-600">
              <Loader2 size={40} className="animate-spin mb-3" />
              <p className="text-sm font-medium">Analyse Claude Vision en cours...</p>
              <p className="text-xs text-gray-400 mt-1">Extraction des quantités depuis le plan</p>
            </div>
          )}

          {selectedPlan?.status === 'error' && (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <AlertTriangle size={40} className="mb-3" />
              <p className="text-sm font-medium">Erreur d'analyse</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs text-center">{selectedPlan.error}</p>
              <button onClick={() => { setPlans(prev => prev.map(p => p.id === selectedPlan.id ? {...p, status: 'idle'} : p)); startAnalysis() }}
                className="mt-3 text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                Réessayer
              </button>
            </div>
          )}

          {selectedPlan?.status === 'idle' && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Play size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Plan prêt · Lancez l'analyse pour extraire les quantités</p>
              <button onClick={startAnalysis}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500">
                <Sparkles size={14} /> Analyser ce plan
              </button>
            </div>
          )}

          {allResults.length > 0 && (
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-500 font-medium">Élément</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Type</th>
                    <th className="text-right px-3 py-2 text-gray-500 font-medium">Quantité</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Zone</th>
                    <th className="text-center px-3 py-2 text-gray-500 font-medium">Confiance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allResults.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {typeIcon(r.type)}
                          <span className="font-medium">{r.element}</span>
                        </div>
                        {r.categorie && <p className="text-gray-400 text-[10px] ml-5">{r.categorie}</p>}
                      </td>
                      <td className="px-3 py-2.5 capitalize text-gray-500">{r.type}</td>
                      <td className="px-3 py-2.5 text-right font-bold">
                        {r.quantite.toLocaleString('fr-CA', { maximumFractionDigits: 1 })} <span className="font-normal text-gray-400">{r.unite}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{r.zone || '—'}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${confColor(r.confiance)}`}>
                          {r.confiance}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="px-4 py-2 text-gray-400 text-[10px]">
                      {allResults.length} éléments · Confiance moy. {avgConfiance}% · Généré par Claude Vision IA
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
