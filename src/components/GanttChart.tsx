/**
 * DAST Solutions - Calendrier Gantt
 * Visualisation des projets et tâches sur une timeline
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  format, differenceInDays, isSameDay, isWithinInterval, eachDayOfInterval,
  addMonths, subMonths, addWeeks, subWeeks
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ChevronLeft, ChevronRight, Calendar, ZoomIn, ZoomOut, 
  Filter, Download, Plus, Edit2, Trash2, Save, X,
  FolderOpen, CheckCircle, Clock, AlertTriangle, 
  GripVertical, MoreVertical, Flag
} from 'lucide-react'

interface GanttTask {
  id: string
  name: string
  projectId?: string
  projectName?: string
  startDate: Date
  endDate: Date
  progress: number
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: string
  dependencies?: string[]
  color?: string
  isMilestone?: boolean
}

interface GanttProps {
  projectId?: string // Si fourni, affiche uniquement les tâches de ce projet
  showProjectsView?: boolean // Vue multi-projets
}

type ViewMode = 'day' | 'week' | 'month'

export default function GanttChart({ projectId, showProjectsView = true }: GanttProps) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<GanttTask[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { locale: fr }))
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Partial<GanttTask> | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')

  const containerRef = useRef<HTMLDivElement>(null)

  // Charger les données
  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les projets avec leurs dates
      let query = supabase
        .from('projects')
        .select('id, name, start_date, deadline, status, progress')
        .eq('user_id', user.id)

      if (projectId) {
        query = query.eq('id', projectId)
      }

      const { data: projects } = await query

      // Charger les tâches de projet
      let tasksQuery = supabase
        .from('project_tasks')
        .select('*, projects!inner(name)')
        .eq('projects.user_id', user.id)

      if (projectId) {
        tasksQuery = tasksQuery.eq('project_id', projectId)
      }

      const { data: projectTasks } = await tasksQuery

      // Convertir en format Gantt
      const ganttTasks: GanttTask[] = []

      // Projets comme tâches parentes
      if (showProjectsView) {
        projects?.forEach(p => {
          ganttTasks.push({
            id: `project-${p.id}`,
            name: p.name,
            projectId: p.id,
            startDate: p.start_date ? new Date(p.start_date) : new Date(),
            endDate: p.deadline ? new Date(p.deadline) : addDays(new Date(), 30),
            progress: p.progress || 0,
            status: mapStatus(p.status),
            priority: 'medium',
            color: getProjectColor(p.status)
          })
        })
      }

      // Tâches individuelles
      projectTasks?.forEach(t => {
        ganttTasks.push({
          id: t.id,
          name: t.title || t.name,
          projectId: t.project_id,
          projectName: t.projects?.name,
          startDate: t.start_date ? new Date(t.start_date) : new Date(),
          endDate: t.due_date ? new Date(t.due_date) : addDays(new Date(), 7),
          progress: t.progress || 0,
          status: mapStatus(t.status),
          priority: t.priority || 'medium',
          assignee: t.assignee,
          dependencies: t.dependencies,
          isMilestone: t.is_milestone
        })
      })

      // Si pas de tâches, créer des données de démo
      if (ganttTasks.length === 0) {
        const demoTasks = generateDemoTasks()
        setTasks(demoTasks)
      } else {
        setTasks(ganttTasks)
      }
    } catch (err) {
      console.error('Erreur chargement Gantt:', err)
    } finally {
      setLoading(false)
    }
  }

  // Mapping de statut
  const mapStatus = (status: string): GanttTask['status'] => {
    switch (status) {
      case 'completed': return 'completed'
      case 'active':
      case 'in_progress': return 'in_progress'
      case 'delayed':
      case 'overdue': return 'delayed'
      default: return 'not_started'
    }
  }

  const getProjectColor = (status: string): string => {
    switch (status) {
      case 'active': return '#10B981'
      case 'completed': return '#6B7280'
      case 'delayed': return '#EF4444'
      default: return '#3B82F6'
    }
  }

  // Données de démo
  const generateDemoTasks = (): GanttTask[] => {
    const today = new Date()
    return [
      {
        id: 'demo-1',
        name: 'Projet Centre Commercial',
        startDate: subDays(today, 10),
        endDate: addDays(today, 45),
        progress: 35,
        status: 'in_progress',
        priority: 'high',
        color: '#10B981'
      },
      {
        id: 'demo-1-1',
        name: 'Fondations',
        projectId: 'demo-1',
        startDate: subDays(today, 10),
        endDate: subDays(today, 2),
        progress: 100,
        status: 'completed',
        priority: 'high'
      },
      {
        id: 'demo-1-2',
        name: 'Structure acier',
        projectId: 'demo-1',
        startDate: subDays(today, 2),
        endDate: addDays(today, 15),
        progress: 40,
        status: 'in_progress',
        priority: 'high',
        dependencies: ['demo-1-1']
      },
      {
        id: 'demo-1-3',
        name: 'Enveloppe',
        projectId: 'demo-1',
        startDate: addDays(today, 10),
        endDate: addDays(today, 35),
        progress: 0,
        status: 'not_started',
        priority: 'medium',
        dependencies: ['demo-1-2']
      },
      {
        id: 'demo-2',
        name: 'Rénovation Bureau',
        startDate: addDays(today, 5),
        endDate: addDays(today, 25),
        progress: 0,
        status: 'not_started',
        priority: 'medium',
        color: '#3B82F6'
      },
      {
        id: 'demo-3',
        name: 'Livraison matériaux',
        startDate: addDays(today, 3),
        endDate: addDays(today, 3),
        progress: 0,
        status: 'not_started',
        priority: 'urgent',
        isMilestone: true
      }
    ]
  }

  // Calculer la plage de dates visible
  const visibleRange = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return { start: startDate, end: addDays(startDate, 14) }
      case 'week':
        return { start: startDate, end: addDays(startDate, 28) }
      case 'month':
        return { start: startOfMonth(startDate), end: endOfMonth(addMonths(startDate, 2)) }
    }
  }, [startDate, viewMode])

  const visibleDays = eachDayOfInterval(visibleRange)

  // Navigation
  const goBack = () => {
    switch (viewMode) {
      case 'day': setStartDate(subDays(startDate, 7)); break
      case 'week': setStartDate(subWeeks(startDate, 2)); break
      case 'month': setStartDate(subMonths(startDate, 1)); break
    }
  }

  const goForward = () => {
    switch (viewMode) {
      case 'day': setStartDate(addDays(startDate, 7)); break
      case 'week': setStartDate(addWeeks(startDate, 2)); break
      case 'month': setStartDate(addMonths(startDate, 1)); break
    }
  }

  const goToToday = () => {
    setStartDate(startOfWeek(new Date(), { locale: fr }))
  }

  // Filtrer les tâches
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterStatus && task.status !== filterStatus) return false
      if (filterPriority && task.priority !== filterPriority) return false
      return true
    })
  }, [tasks, filterStatus, filterPriority])

  // Calculer la position et largeur d'une barre
  const getBarStyle = (task: GanttTask) => {
    const totalDays = differenceInDays(visibleRange.end, visibleRange.start) + 1
    const startOffset = Math.max(0, differenceInDays(task.startDate, visibleRange.start))
    const endOffset = Math.min(totalDays, differenceInDays(task.endDate, visibleRange.start) + 1)
    const width = endOffset - startOffset

    if (width <= 0 || startOffset >= totalDays) return null

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(width / totalDays) * 100}%`
    }
  }

  // Couleurs de statut
  const statusColors: Record<string, { bg: string; border: string }> = {
    not_started: { bg: 'bg-gray-200 dark:bg-gray-700', border: 'border-gray-300' },
    in_progress: { bg: 'bg-blue-500', border: 'border-blue-600' },
    completed: { bg: 'bg-green-500', border: 'border-green-600' },
    delayed: { bg: 'bg-red-500', border: 'border-red-600' }
  }

  const priorityColors: Record<string, string> = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500'
  }

  // Sauvegarder une tâche
  const saveTask = async () => {
    if (!editingTask) return

    // TODO: Sauvegarder dans Supabase
    setShowTaskModal(false)
    setEditingTask(null)
    await loadTasks()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-teal-500" />
            Calendrier Gantt
          </h2>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={goBack} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Aujourd'hui
            </button>
            <button onClick={goForward} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ChevronRight size={18} />
            </button>
          </div>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {format(visibleRange.start, 'dd MMM', { locale: fr })} - {format(visibleRange.end, 'dd MMM yyyy', { locale: fr })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtres */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Tous les statuts</option>
            <option value="not_started">Non commencé</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="delayed">En retard</option>
          </select>

          {/* Vue */}
          <div className="flex rounded-lg border dark:border-gray-600 overflow-hidden">
            {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm ${
                  viewMode === mode
                    ? 'bg-teal-500 text-white'
                    : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>

          {/* Ajouter tâche */}
          <button
            onClick={() => { setEditingTask({}); setShowTaskModal(true) }}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={16} /> Tâche
          </button>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="flex border-b dark:border-gray-700">
        {/* Liste des tâches - header */}
        <div className="w-72 flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-700">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tâches</span>
        </div>

        {/* Timeline - dates */}
        <div className="flex-1 overflow-x-auto" ref={containerRef}>
          <div className="flex min-w-max">
            {visibleDays.map((day, i) => {
              const isToday = isSameDay(day, new Date())
              const isWeekend = day.getDay() === 0 || day.getDay() === 6

              return (
                <div
                  key={i}
                  className={`flex-1 min-w-[40px] text-center py-2 border-r dark:border-gray-700 ${
                    isToday ? 'bg-teal-50 dark:bg-teal-900/30' : 
                    isWeekend ? 'bg-gray-50 dark:bg-gray-900' : ''
                  }`}
                >
                  <div className="text-xs text-gray-400">{format(day, 'EEE', { locale: fr })}</div>
                  <div className={`text-sm font-medium ${isToday ? 'text-teal-600 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tâches */}
      <div className="max-h-[500px] overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucune tâche à afficher</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const barStyle = getBarStyle(task)
            const colors = statusColors[task.status]
            const isProject = task.id.startsWith('project-') || task.id.startsWith('demo-') && !task.projectId

            return (
              <div
                key={task.id}
                className={`flex border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 ${
                  isProject ? 'bg-gray-50 dark:bg-gray-900' : ''
                }`}
              >
                {/* Info tâche */}
                <div className={`w-72 flex-shrink-0 px-4 py-3 border-r dark:border-gray-700 ${
                  task.projectId && !isProject ? 'pl-8' : ''
                }`}>
                  <div className="flex items-center gap-2">
                    {task.isMilestone ? (
                      <Flag size={14} className="text-purple-500" />
                    ) : isProject ? (
                      <FolderOpen size={14} className="text-teal-500" />
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                    )}
                    <span
                      className={`text-sm font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-teal-600 ${
                        isProject ? 'font-semibold' : ''
                      }`}
                      onClick={() => { setSelectedTask(task); setEditingTask(task); setShowTaskModal(true) }}
                    >
                      {task.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{format(task.startDate, 'dd/MM')} - {format(task.endDate, 'dd/MM')}</span>
                    {task.progress > 0 && (
                      <span className="text-teal-600">{task.progress}%</span>
                    )}
                  </div>
                </div>

                {/* Timeline bar */}
                <div className="flex-1 relative py-3">
                  {/* Ligne verticale aujourd'hui */}
                  {visibleDays.some(d => isSameDay(d, new Date())) && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-teal-500 z-10"
                      style={{
                        left: `${(differenceInDays(new Date(), visibleRange.start) / (differenceInDays(visibleRange.end, visibleRange.start) + 1)) * 100}%`
                      }}
                    />
                  )}

                  {barStyle && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-6 rounded cursor-pointer transition-all hover:h-8"
                      style={{
                        left: barStyle.left,
                        width: barStyle.width,
                        backgroundColor: task.color || (task.status === 'completed' ? '#10B981' : task.status === 'delayed' ? '#EF4444' : '#3B82F6'),
                        minWidth: task.isMilestone ? '12px' : '20px'
                      }}
                      onClick={() => { setSelectedTask(task); setEditingTask(task); setShowTaskModal(true) }}
                    >
                      {/* Barre de progression */}
                      {task.progress > 0 && task.progress < 100 && !task.isMilestone && (
                        <div
                          className="absolute top-0 left-0 h-full bg-white/30 rounded-l"
                          style={{ width: `${task.progress}%` }}
                        />
                      )}

                      {/* Milestone diamond */}
                      {task.isMilestone && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 rotate-45" />
                      )}

                      {/* Label */}
                      {!task.isMilestone && parseFloat(barStyle.width) > 10 && (
                        <span className="absolute inset-0 flex items-center px-2 text-xs text-white truncate">
                          {task.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal édition tâche */}
      {showTaskModal && editingTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingTask.id ? 'Modifier la tâche' : 'Nouvelle tâche'}
              </h3>
              <button onClick={() => { setShowTaskModal(false); setEditingTask(null) }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                <input
                  type="text"
                  value={editingTask.name || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Nom de la tâche"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date début</label>
                  <input
                    type="date"
                    value={editingTask.startDate ? format(new Date(editingTask.startDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, startDate: new Date(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin</label>
                  <input
                    type="date"
                    value={editingTask.endDate ? format(new Date(editingTask.endDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, endDate: new Date(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
                  <select
                    value={editingTask.status || 'not_started'}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="not_started">Non commencé</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="delayed">En retard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priorité</label>
                  <select
                    value={editingTask.priority || 'medium'}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Progression: {editingTask.progress || 0}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingTask.progress || 0}
                  onChange={(e) => setEditingTask({ ...editingTask, progress: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMilestone"
                  checked={editingTask.isMilestone || false}
                  onChange={(e) => setEditingTask({ ...editingTask, isMilestone: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isMilestone" className="text-sm text-gray-700 dark:text-gray-300">
                  Marquer comme jalon (milestone)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
              <button
                onClick={() => { setShowTaskModal(false); setEditingTask(null) }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={saveTask}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Save size={16} /> Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
