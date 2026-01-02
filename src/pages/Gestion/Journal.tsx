/**
 * DAST Solutions - Journal de Chantier (Daily Reports)
 * Suivi quotidien des activités de construction
 */
import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, Calendar, Cloud, Sun, CloudRain, CloudSnow,
  Thermometer, Wind, Users, Clock, FileText, Camera, Save,
  X, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle,
  Edit2, Trash2, Eye
} from 'lucide-react'

interface Project {
  id: string
  name: string
}

interface DailyReport {
  id: string
  project_id: string
  date: string
  weather_condition: string
  temperature_high?: number
  temperature_low?: number
  wind_speed?: number
  precipitation?: string
  work_performed: string
  workers_on_site: number
  visitors?: string
  equipment_used?: string
  materials_delivered?: string
  delays_issues?: string
  safety_incidents?: string
  photos?: string[]
  notes?: string
  created_by?: string
  created_at: string
}

const WEATHER_OPTIONS = [
  { value: 'sunny', label: 'Ensoleillé', icon: Sun },
  { value: 'cloudy', label: 'Nuageux', icon: Cloud },
  { value: 'rain', label: 'Pluie', icon: CloudRain },
  { value: 'snow', label: 'Neige', icon: CloudSnow },
]

export default function GestionJournal() {
  const { project } = useOutletContext<{ project: Project }>()
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null)

  // Charger les rapports
  useEffect(() => {
    loadReports()
  }, [project.id])

  const loadReports = async () => {
    try {
      const { data } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('project_id', project.id)
        .order('date', { ascending: false })

      setReports(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Obtenir le rapport pour une date
  const getReportForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return reports.find(r => r.date === dateStr)
  }

  // Navigation calendrier
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 7)
    setSelectedDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 7)
    setSelectedDate(newDate)
  }

  // Obtenir les jours de la semaine
  const getWeekDays = () => {
    const days = []
    const startOfWeek = new Date(selectedDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  const weekDays = getWeekDays()
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal de chantier</h1>
          <p className="text-gray-500">Suivi quotidien des activités et conditions</p>
        </div>
        <button 
          onClick={() => {
            setSelectedReport(null)
            setShowAddModal(true)
          }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Nouveau rapport
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Rapports ce mois</p>
          <p className="text-2xl font-bold text-gray-900">
            {reports.filter(r => r.date.startsWith(new Date().toISOString().slice(0, 7))).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Jours travaillés</p>
          <p className="text-2xl font-bold text-teal-600">{reports.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Moy. travailleurs/jour</p>
          <p className="text-2xl font-bold text-blue-600">
            {reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.workers_on_site, 0) / reports.length) : 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Incidents signalés</p>
          <p className="text-2xl font-bold text-amber-600">
            {reports.filter(r => r.safety_incidents).length}
          </p>
        </div>
      </div>

      {/* Calendrier semaine */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-semibold">
            {weekDays[0].toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {weekDays.map(day => {
            const dateStr = day.toISOString().split('T')[0]
            const report = getReportForDate(day)
            const isToday = dateStr === todayStr
            const isPast = day < new Date(todayStr)
            const WeatherIcon = report ? WEATHER_OPTIONS.find(w => w.value === report.weather_condition)?.icon || Cloud : null

            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (report) {
                    setSelectedReport(report)
                    setShowAddModal(true)
                  } else if (isPast || isToday) {
                    setSelectedReport(null)
                    setShowAddModal(true)
                  }
                }}
                className={`p-3 rounded-lg text-center transition ${
                  isToday ? 'ring-2 ring-teal-500' : ''
                } ${
                  report ? 'bg-teal-50 hover:bg-teal-100' : 
                  isPast ? 'bg-gray-50 hover:bg-gray-100' : 
                  'bg-white hover:bg-gray-50 text-gray-400'
                }`}
              >
                <p className={`text-lg font-semibold ${isToday ? 'text-teal-600' : ''}`}>
                  {day.getDate()}
                </p>
                {report && WeatherIcon && (
                  <WeatherIcon size={16} className="mx-auto mt-1 text-gray-500" />
                )}
                {report && (
                  <p className="text-xs text-gray-500 mt-1">{report.workers_on_site} 👷</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Liste des rapports récents */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Rapports récents</h3>
        </div>
        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">Aucun rapport de chantier</p>
            <p className="text-sm text-gray-400 mt-1">
              Créez un rapport quotidien pour documenter les activités
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {reports.slice(0, 10).map(report => {
              const WeatherIcon = WEATHER_OPTIONS.find(w => w.value === report.weather_condition)?.icon || Cloud

              return (
                <div 
                  key={report.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedReport(report)
                    setShowAddModal(true)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-2xl font-bold text-gray-900">
                          {new Date(report.date).getDate()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(report.date).toLocaleDateString('fr-CA', { month: 'short' })}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <WeatherIcon size={16} className="text-gray-400" />
                          {report.temperature_high && (
                            <span className="text-sm text-gray-500">
                              {report.temperature_low}°/{report.temperature_high}°C
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            <Users size={14} className="inline mr-1" />
                            {report.workers_on_site} travailleurs
                          </span>
                        </div>
                        <p className="text-gray-700 line-clamp-2">{report.work_performed}</p>
                        {report.delays_issues && (
                          <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle size={14} />
                            {report.delays_issues}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Ajouter/Éditer rapport */}
      {showAddModal && (
        <DailyReportModal
          projectId={project.id}
          report={selectedReport}
          onClose={() => {
            setShowAddModal(false)
            setSelectedReport(null)
          }}
          onSave={() => {
            setShowAddModal(false)
            setSelectedReport(null)
            loadReports()
          }}
        />
      )}
    </div>
  )
}

// Modal pour créer/éditer un rapport
function DailyReportModal({ projectId, report, onClose, onSave }: {
  projectId: string
  report: DailyReport | null
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    date: report?.date || new Date().toISOString().split('T')[0],
    weather_condition: report?.weather_condition || 'cloudy',
    temperature_high: report?.temperature_high?.toString() || '',
    temperature_low: report?.temperature_low?.toString() || '',
    workers_on_site: report?.workers_on_site?.toString() || '',
    work_performed: report?.work_performed || '',
    equipment_used: report?.equipment_used || '',
    materials_delivered: report?.materials_delivered || '',
    delays_issues: report?.delays_issues || '',
    safety_incidents: report?.safety_incidents || '',
    visitors: report?.visitors || '',
    notes: report?.notes || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.work_performed || !form.workers_on_site) return

    setSaving(true)
    try {
      const data = {
        project_id: projectId,
        date: form.date,
        weather_condition: form.weather_condition,
        temperature_high: form.temperature_high ? parseInt(form.temperature_high) : null,
        temperature_low: form.temperature_low ? parseInt(form.temperature_low) : null,
        workers_on_site: parseInt(form.workers_on_site) || 0,
        work_performed: form.work_performed,
        equipment_used: form.equipment_used || null,
        materials_delivered: form.materials_delivered || null,
        delays_issues: form.delays_issues || null,
        safety_incidents: form.safety_incidents || null,
        visitors: form.visitors || null,
        notes: form.notes || null
      }

      if (report) {
        const { error } = await supabase
          .from('daily_reports')
          .update(data)
          .eq('id', report.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('daily_reports')
          .insert(data)
        if (error) throw error
      }

      onSave()
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {report ? 'Modifier le rapport' : 'Nouveau rapport de chantier'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Date et météo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Météo</label>
              <select
                value={form.weather_condition}
                onChange={(e) => setForm({ ...form, weather_condition: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {WEATHER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Températures */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temp. min (°C)</label>
              <input
                type="number"
                value={form.temperature_low}
                onChange={(e) => setForm({ ...form, temperature_low: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="-5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temp. max (°C)</label>
              <input
                type="number"
                value={form.temperature_high}
                onChange={(e) => setForm({ ...form, temperature_high: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Travailleurs <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.workers_on_site}
                onChange={(e) => setForm({ ...form, workers_on_site: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="12"
              />
            </div>
          </div>

          {/* Travaux effectués */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Travaux effectués <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.work_performed}
              onChange={(e) => setForm({ ...form, work_performed: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Décrivez les travaux réalisés aujourd'hui..."
            />
          </div>

          {/* Équipement et matériaux */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Équipement utilisé</label>
              <input
                type="text"
                value={form.equipment_used}
                onChange={(e) => setForm({ ...form, equipment_used: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Grue, excavatrice, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matériaux livrés</label>
              <input
                type="text"
                value={form.materials_delivered}
                onChange={(e) => setForm({ ...form, materials_delivered: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Béton, acier, etc."
              />
            </div>
          </div>

          {/* Problèmes et sécurité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retards / Problèmes</label>
            <textarea
              value={form.delays_issues}
              onChange={(e) => setForm({ ...form, delays_issues: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Décrivez tout retard ou problème rencontré..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incidents de sécurité</label>
            <textarea
              value={form.safety_incidents}
              onChange={(e) => setForm({ ...form, safety_incidents: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg border-amber-200 bg-amber-50"
              placeholder="Décrivez tout incident de sécurité (aucun si vide)..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes additionnelles</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Autres observations..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.work_performed || !form.workers_on_site}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <span className="animate-spin">⏳</span> : <Save size={16} />}
            {report ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
