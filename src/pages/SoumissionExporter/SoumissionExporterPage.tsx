/**
 * DAST Solutions - Page Exporter Soumission
 * Wrapper standalone qui charge les données depuis Supabase
 */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import SoumissionExporterModule from './SoumissionExporterModule'
import { Loader2, FileSpreadsheet } from 'lucide-react'

export default function SoumissionExporterPage() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')

  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '')
  const [lines, setLines] = useState<any[]>([])
  const [projectInfo, setProjectInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [config] = useState({
    admin_pct: 0.08,
    profit_pct: 0.10,
    contingency_pct: 0.05,
    bond_pct: 0.015,
    insurance_pct: 0.01,
  })

  // Charger la liste des projets
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('projects')
        .select('id, name, client_name, address, city')
        .order('created_at', { ascending: false })
      setProjects(data || [])
    }
    load()
  }, [])

  // Charger les lignes d'estimation du projet sélectionné
  useEffect(() => {
    if (!selectedProjectId) return
    const load = async () => {
      setLoading(true)
      try {
        const proj = projects.find(p => p.id === selectedProjectId)
        if (proj) {
          setProjectInfo({
            name: proj.name,
            number: proj.id.slice(0, 8).toUpperCase(),
            estimators: ['Précision DP'],
            date: new Date().toLocaleDateString('fr-CA'),
            client: proj.client_name || '',
            address: proj.address || '',
          })
        }

        // Chercher les items via estimate_items
        const { data: estimates } = await supabase
          .from('estimates')
          .select('id')
          .eq('project_id', selectedProjectId)
          .limit(1)

        if (estimates && estimates.length > 0) {
          const { data: items } = await supabase
            .from('estimate_items')
            .select('*')
            .eq('estimate_id', estimates[0].id)
            .order('sort_order')

          const mapped = (items || []).map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            price_material: item.material_total || 0,
            price_labor: item.labor_total || 0,
            price_equipment: item.equipment_total || 0,
            price_total: item.line_total || 0,
            csc_division: item.division_code || '03',
            notes: item.notes || '',
          }))
          setLines(mapped)
        } else {
          setLines([])
        }
      } catch (err) {
        console.error(err)
        setLines([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedProjectId, projects])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="text-teal-600" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Exporter soumission</h1>
            <p className="text-sm text-gray-500">Générer un Excel ou PDF professionnel</p>
          </div>
        </div>

        {/* Sélecteur de projet */}
        <div className="bg-white rounded-xl border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Projet</label>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">-- Choisir un projet --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-teal-600" size={32} />
          </div>
        )}

        {!loading && selectedProjectId && projectInfo && (
          <SoumissionExporterModule
            lines={lines}
            project={projectInfo}
            config={config}
          />
        )}

        {!loading && selectedProjectId && !projectInfo && (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            Chargement du projet...
          </div>
        )}
      </div>
    </div>
  )
}
