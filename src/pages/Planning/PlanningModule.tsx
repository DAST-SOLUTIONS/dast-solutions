/**
 * DAST Solutions - Module de Planification
 * Gantt Chart, Calendrier, Jalons, Ressources
 */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Calendar, BarChart3, Users, Flag, Clock, ChevronLeft, ChevronRight,
  Plus, Edit, Trash2, Eye, Filter, Download, Upload, Settings,
  AlertTriangle, CheckCircle, Circle, ArrowRight, Maximize2,
  ZoomIn, ZoomOut, Layers, Target, Milestone, CalendarDays,
  GripVertical, Link2, Unlink, Play, Pause, RotateCcw, Save,
  FileText, Printer, Share2, MoreHorizontal, X, Check
} from 'lucide-react'

// Types
interface Task {
  id: string
  name: string
  startDate: Date
  endDate: Date
  progress: number
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignees: string[]
  parentId?: string
  dependencies: string[]
  color?: string
  isMilestone?: boolean
  notes?: string
}

interface Resource {
  id: string
  name: string
  role: string
  avatar?: string
  availability: number // percentage
  tasks: string[]
}

interface CalendarEvent {
  id: string
  title: string
  date: Date
  endDate?: Date
  type: 'task' | 'milestone' | 'meeting' | 'deadline' | 'reminder'
  color: string
  taskId?: string
}

// Données de démo
const DEMO_TASKS: Task[] = [
  {
    id: 'task-1',
    name: 'Phase 1: Préparation du site',
    startDate: new Date(2025, 0, 13),
    endDate: new Date(2025, 0, 24),
    progress: 100,
    status: 'completed',
    priority: 'high',
    assignees: ['user-1', 'user-2'],
    dependencies: [],
    color: '#10B981'
  },
  {
    id: 'task-2',
    name: 'Excavation et fondations',
    startDate: new Date(2025, 0, 20),
    endDate: new Date(2025, 1, 7),
    progress: 75,
    status: 'in_progress',
    priority: 'high',
    assignees: ['user-2', 'user-3'],
    dependencies: ['task-1'],
    color: '#3B82F6'
  },
  {
    id: 'task-3',
    name: 'Coffrage et coulée béton',
    startDate: new Date(2025, 1, 3),
    endDate: new Date(2025, 1, 21),
    progress: 30,
    status: 'in_progress',
    priority: 'medium',
    assignees: ['user-3'],
    dependencies: ['task-2'],
    color: '#8B5CF6'
  },
  {
    id: 'task-4',
    name: 'Inspection fondations',
    startDate: new Date(2025, 1, 21),
    endDate: new Date(2025, 1, 21),
    progress: 0,
    status: 'not_started',
    priority: 'critical',
    assignees: ['user-1'],
    dependencies: ['task-3'],
    isMilestone: true,
    color: '#EF4444'
  },
  {
    id: 'task-5',
    name: 'Structure acier',
    startDate: new Date(2025, 1, 24),
    endDate: new Date(2025, 2, 21),
    progress: 0,
    status: 'not_started',
    priority: 'high',
    assignees: ['user-2', 'user-4'],
    dependencies: ['task-4'],
    color: '#F59E0B'
  },
  {
    id: 'task-6',
    name: 'Maçonnerie extérieure',
    startDate: new Date(2025, 2, 10),
    endDate: new Date(2025, 3, 4),
    progress: 0,
    status: 'not_started',
    priority: 'medium',
    assignees: ['user-5'],
    dependencies: ['task-5'],
    color: '#EC4899'
  },
  {
    id: 'task-7',
    name: 'Toiture',
    startDate: new Date(2025, 2, 24),
    endDate: new Date(2025, 3, 11),
    progress: 0,
    status: 'not_started',
    priority: 'medium',
    assignees: ['user-6'],
    dependencies: ['task-5'],
    color: '#06B6D4'
  },
  {
    id: 'task-8',
    name: 'Livraison Phase 1',
    startDate: new Date(2025, 3, 15),
    endDate: new Date(2025, 3, 15),
    progress: 0,
    status: 'not_started',
    priority: 'critical',
    assignees: [],
    dependencies: ['task-6', 'task-7'],
    isMilestone: true,
    color: '#10B981'
  }
]

const DEMO_RESOURCES: Resource[] = [
  { id: 'user-1', name: 'Jean Tremblay', role: 'Chef de projet', availability: 100, tasks: ['task-1', 'task-4'] },
  { id: 'user-2', name: 'Marie Dubois', role: 'Contremaître', availability: 100, tasks: ['task-1', 'task-2', 'task-5'] },
  { id: 'user-3', name: 'Pierre Martin', role: 'Cimentier', availability: 80, tasks: ['task-2', 'task-3'] },
  { id: 'user-4', name: 'Sophie Lavoie', role: 'Charpentier-fer', availability: 100, tasks: ['task-5'] },
  { id: 'user-5', name: 'Luc Bergeron', role: 'Briqueteur', availability: 100, tasks: ['task-6'] },
  { id: 'user-6', name: 'André Gagnon', role: 'Couvreur', availability: 75, tasks: ['task-7'] },
]

export default function PlanningModule() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  // États
  const [activeView, setActiveView] = useState<'gantt' | 'calendar' | 'resources' | 'milestones'>('gantt')
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS)
  const [resources, setResources] = useState<Resource[]>(DEMO_RESOURCES)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 13))
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date(2025, 0, 1))

  // Calcul des dates du Gantt
  const getDateRange = () => {
    const start = new Date(currentDate)
    let days = 0
    
    switch (zoomLevel) {
      case 'day': days = 14; break
      case 'week': days = 56; break
      case 'month': days = 90; break
    }
    
    const end = new Date(start)
    end.setDate(end.getDate() + days)
    
    return { start, end, days }
  }

  const dateRange = getDateRange()

  // Navigation temporelle
  const navigateTime = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    const offset = direction === 'prev' ? -1 : 1
    
    switch (zoomLevel) {
      case 'day': newDate.setDate(newDate.getDate() + offset * 7); break
      case 'week': newDate.setDate(newDate.getDate() + offset * 28); break
      case 'month': newDate.setMonth(newDate.getMonth() + offset * 2); break
    }
    
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calcul position/largeur des barres Gantt
  const getTaskPosition = (task: Task) => {
    const totalDays = dateRange.days
    const startDiff = Math.floor((task.startDate.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
    const duration = Math.max(1, Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    
    const left = Math.max(0, (startDiff / totalDays) * 100)
    const width = Math.min(100 - left, (duration / totalDays) * 100)
    
    return { left: `${left}%`, width: `${Math.max(width, 1)}%` }
  }

  // Génération des colonnes de dates
  const generateDateColumns = () => {
    const columns = []
    const current = new Date(dateRange.start)
    
    while (current <= dateRange.end) {
      const isToday = current.toDateString() === new Date().toDateString()
      const isWeekend = current.getDay() === 0 || current.getDay() === 6
      
      columns.push({
        date: new Date(current),
        isToday,
        isWeekend,
        label: zoomLevel === 'month' 
          ? (current.getDate() === 1 ? current.toLocaleDateString('fr-CA', { month: 'short' }) : '')
          : current.getDate().toString()
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    return columns
  }

  const dateColumns = generateDateColumns()

  // Gestion des tâches
  const handleCreateTask = () => {
    setEditingTask(null)
    setShowTaskModal(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowTaskModal(true)
  }

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t))
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        name: taskData.name || 'Nouvelle tâche',
        startDate: taskData.startDate || new Date(),
        endDate: taskData.endDate || new Date(),
        progress: 0,
        status: 'not_started',
        priority: taskData.priority || 'medium',
        assignees: [],
        dependencies: [],
        ...taskData
      }
      setTasks(prev => [...prev, newTask])
    }
    setShowTaskModal(false)
    setEditingTask(null)
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Supprimer cette tâche?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId))
    }
  }

  const updateTaskProgress = (taskId: string, progress: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started'
        return { ...t, progress, status }
      }
      return t
    }))
  }

  // Statistiques
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    delayed: tasks.filter(t => t.status === 'delayed').length,
    milestones: tasks.filter(t => t.isMilestone).length,
    avgProgress: Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} className="text-emerald-500" />
      case 'in_progress': return <Play size={14} className="text-blue-500" />
      case 'delayed': return <AlertTriangle size={14} className="text-red-500" />
      case 'on_hold': return <Pause size={14} className="text-amber-500" />
      default: return <Circle size={14} className="text-gray-400" />
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-blue-600 bg-blue-100'
      case 'low': return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-teal-600" />
              Planification
              {projectId && <span className="text-gray-400 font-normal">- Projet #{projectId}</span>}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateTask}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Nouvelle tâche
            </button>
            <button className="p-2 border rounded-lg hover:bg-gray-50">
              <Download size={18} />
            </button>
            <button className="p-2 border rounded-lg hover:bg-gray-50">
              <Printer size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Total:</span>
            <span className="font-semibold">{stats.total} tâches</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500" />
            <span>{stats.completed} terminées</span>
          </div>
          <div className="flex items-center gap-2">
            <Play size={14} className="text-blue-500" />
            <span>{stats.inProgress} en cours</span>
          </div>
          <div className="flex items-center gap-2">
            <Flag size={14} className="text-purple-500" />
            <span>{stats.milestones} jalons</span>
          </div>
          <div className="flex items-center gap-2">
            <Target size={14} className="text-teal-500" />
            <span>Progression: {stats.avgProgress}%</span>
          </div>
        </div>
      </div>

      {/* View Tabs & Controls */}
      <div className="bg-white border-b px-6 py-2 flex items-center justify-between">
        <div className="flex gap-1">
          {[
            { id: 'gantt', label: 'Gantt', icon: BarChart3 },
            { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
            { id: 'resources', label: 'Ressources', icon: Users },
            { id: 'milestones', label: 'Jalons', icon: Milestone },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
                activeView === view.id
                  ? 'bg-teal-100 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <view.icon size={16} />
              {view.label}
            </button>
          ))}
        </div>

        {activeView === 'gantt' && (
          <div className="flex items-center gap-4">
            {/* Zoom Level */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['day', 'week', 'month'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setZoomLevel(level)}
                  className={`px-3 py-1 rounded text-sm ${
                    zoomLevel === level ? 'bg-white shadow' : ''
                  }`}
                >
                  {level === 'day' ? 'Jour' : level === 'week' ? 'Semaine' : 'Mois'}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateTime('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => navigateTime('next')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() - 1)))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-medium min-w-[150px] text-center">
              {calendarMonth.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() + 1)))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Gantt View */}
        {activeView === 'gantt' && (
          <div className="h-full flex">
            {/* Task List */}
            <div className="w-96 bg-white border-r overflow-y-auto">
              <div className="sticky top-0 bg-gray-100 border-b px-4 py-2 text-xs font-medium text-gray-500 grid grid-cols-12 gap-2">
                <div className="col-span-6">Tâche</div>
                <div className="col-span-2">Début</div>
                <div className="col-span-2">Fin</div>
                <div className="col-span-2">Progrès</div>
              </div>
              
              {tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer grid grid-cols-12 gap-2 items-center text-sm ${
                    selectedTask?.id === task.id ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className="col-span-6 flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span className={`truncate ${task.isMilestone ? 'font-semibold' : ''}`}>
                      {task.isMilestone && <Flag size={12} className="inline mr-1 text-purple-500" />}
                      {task.name}
                    </span>
                  </div>
                  <div className="col-span-2 text-gray-500 text-xs">
                    {formatDate(task.startDate)}
                  </div>
                  <div className="col-span-2 text-gray-500 text-xs">
                    {formatDate(task.endDate)}
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{task.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Gantt Chart */}
            <div className="flex-1 overflow-x-auto">
              {/* Date Header */}
              <div className="sticky top-0 bg-gray-100 border-b flex h-10 z-10">
                {dateColumns.map((col, i) => (
                  <div
                    key={i}
                    className={`flex-shrink-0 border-r text-xs flex items-center justify-center ${
                      col.isToday ? 'bg-teal-100 font-bold' : 
                      col.isWeekend ? 'bg-gray-200' : ''
                    }`}
                    style={{ width: zoomLevel === 'day' ? 40 : zoomLevel === 'week' ? 20 : 12 }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Task Bars */}
              <div className="relative">
                {/* Today Line */}
                {dateColumns.findIndex(c => c.isToday) >= 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                    style={{
                      left: `${(dateColumns.findIndex(c => c.isToday) / dateColumns.length) * 100}%`
                    }}
                  />
                )}

                {tasks.map((task, index) => {
                  const pos = getTaskPosition(task)
                  return (
                    <div
                      key={task.id}
                      className="h-12 border-b relative flex items-center"
                      style={{ background: dateColumns.map((c, i) => c.isWeekend ? '#f3f4f6' : '#fff').join('') }}
                    >
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex">
                        {dateColumns.map((col, i) => (
                          <div
                            key={i}
                            className={`flex-shrink-0 border-r ${col.isWeekend ? 'bg-gray-100' : ''}`}
                            style={{ width: zoomLevel === 'day' ? 40 : zoomLevel === 'week' ? 20 : 12 }}
                          />
                        ))}
                      </div>

                      {/* Task Bar */}
                      <div
                        className={`absolute h-7 rounded cursor-pointer transition-all hover:opacity-80 ${
                          task.isMilestone ? 'flex items-center justify-center' : ''
                        }`}
                        style={{
                          left: pos.left,
                          width: task.isMilestone ? '24px' : pos.width,
                          backgroundColor: task.isMilestone ? 'transparent' : task.color,
                          marginLeft: task.isMilestone ? '-12px' : 0
                        }}
                        onClick={() => handleEditTask(task)}
                        title={`${task.name} (${task.progress}%)`}
                      >
                        {task.isMilestone ? (
                          <div
                            className="w-5 h-5 rotate-45"
                            style={{ backgroundColor: task.color }}
                          />
                        ) : (
                          <>
                            {/* Progress */}
                            <div
                              className="absolute inset-y-0 left-0 rounded-l opacity-50"
                              style={{
                                width: `${task.progress}%`,
                                backgroundColor: 'rgba(255,255,255,0.3)'
                              }}
                            />
                            {/* Label */}
                            <span className="absolute inset-0 flex items-center px-2 text-white text-xs truncate">
                              {task.name}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Dependencies */}
                      {task.dependencies.map(depId => {
                        const depTask = tasks.find(t => t.id === depId)
                        if (!depTask) return null
                        // Simplified - would need proper arrow drawing
                        return null
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {activeView === 'calendar' && (
          <CalendarView
            tasks={tasks}
            currentMonth={calendarMonth}
            onTaskClick={handleEditTask}
          />
        )}

        {/* Resources View */}
        {activeView === 'resources' && (
          <ResourcesView
            resources={resources}
            tasks={tasks}
            onAssignTask={(resourceId, taskId) => {
              setTasks(prev => prev.map(t => 
                t.id === taskId 
                  ? { ...t, assignees: [...new Set([...t.assignees, resourceId])] }
                  : t
              ))
            }}
          />
        )}

        {/* Milestones View */}
        {activeView === 'milestones' && (
          <MilestonesView
            tasks={tasks.filter(t => t.isMilestone)}
            onEditMilestone={handleEditTask}
          />
        )}
      </div>

      {/* Task Detail Sidebar */}
      {selectedTask && activeView === 'gantt' && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l shadow-lg z-30 overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Détails de la tâche</h3>
            <button onClick={() => setSelectedTask(null)} className="p-1 hover:bg-gray-100 rounded">
              <X size={18} />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-500">Nom</label>
              <p className="font-medium">{selectedTask.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Début</label>
                <p>{formatDate(selectedTask.startDate)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Fin</label>
                <p>{formatDate(selectedTask.endDate)}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Progression</label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedTask.progress}
                  onChange={(e) => updateTaskProgress(selectedTask.id, Number(e.target.value))}
                  className="flex-1"
                />
                <span className="font-medium w-12">{selectedTask.progress}%</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Priorité</label>
              <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${getPriorityColor(selectedTask.priority)}`}>
                {selectedTask.priority === 'critical' ? 'Critique' :
                 selectedTask.priority === 'high' ? 'Haute' :
                 selectedTask.priority === 'medium' ? 'Moyenne' : 'Basse'}
              </span>
            </div>

            <div>
              <label className="text-xs text-gray-500">Assignés</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedTask.assignees.map(id => {
                  const resource = resources.find(r => r.id === id)
                  return resource ? (
                    <span key={id} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {resource.name}
                    </span>
                  ) : null
                })}
                {selectedTask.assignees.length === 0 && (
                  <span className="text-gray-400 text-sm">Aucun</span>
                )}
              </div>
            </div>

            {selectedTask.dependencies.length > 0 && (
              <div>
                <label className="text-xs text-gray-500">Dépendances</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTask.dependencies.map(depId => {
                    const depTask = tasks.find(t => t.id === depId)
                    return depTask ? (
                      <span key={depId} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center gap-1">
                        <Link2 size={10} />
                        {depTask.name}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t flex gap-2">
              <button
                onClick={() => handleEditTask(selectedTask)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1"
              >
                <Edit size={14} />
                Modifier
              </button>
              <button
                onClick={() => {
                  handleDeleteTask(selectedTask.id)
                  setSelectedTask(null)
                }}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          resources={resources}
          tasks={tasks}
          onSave={handleSaveTask}
          onClose={() => {
            setShowTaskModal(false)
            setEditingTask(null)
          }}
        />
      )}
    </div>
  )
}

// Calendar View Component
function CalendarView({ 
  tasks, 
  currentMonth, 
  onTaskClick 
}: { 
  tasks: Task[]
  currentMonth: Date
  onTaskClick: (task: Task) => void
}) {
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    // Add padding for first week
    const startPadding = firstDay.getDay()
    for (let i = 0; i < startPadding; i++) {
      const d = new Date(firstDay)
      d.setDate(d.getDate() - (startPadding - i))
      days.push({ date: d, isCurrentMonth: false })
    }
    
    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
    
    // Add padding for last week
    const endPadding = 42 - days.length
    for (let i = 1; i <= endPadding; i++) {
      const d = new Date(lastDay)
      d.setDate(d.getDate() + i)
      days.push({ date: d, isCurrentMonth: false })
    }
    
    return days
  }

  const days = getDaysInMonth()
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = task.startDate.toDateString()
      const endDate = task.endDate.toDateString()
      const checkDate = date.toDateString()
      return taskDate === checkDate || endDate === checkDate ||
        (date >= task.startDate && date <= task.endDate)
    })
  }

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-gray-100">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayTasks = getTasksForDate(day.date)
            const isToday = day.date.toDateString() === new Date().toDateString()
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b ${
                  !day.isCurrentMonth ? 'bg-gray-50' : ''
                } ${isToday ? 'bg-teal-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  !day.isCurrentMonth ? 'text-gray-400' : 
                  isToday ? 'text-teal-600' : 'text-gray-700'
                }`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: task.color, color: '#fff' }}
                    >
                      {task.isMilestone && <Flag size={10} className="inline mr-1" />}
                      {task.name}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500">+{dayTasks.length - 3} autres</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Resources View Component
function ResourcesView({ 
  resources, 
  tasks,
  onAssignTask 
}: { 
  resources: Resource[]
  tasks: Task[]
  onAssignTask: (resourceId: string, taskId: string) => void
}) {
  const getResourceTasks = (resourceId: string) => {
    return tasks.filter(t => t.assignees.includes(resourceId))
  }

  const getResourceLoad = (resourceId: string) => {
    const assignedTasks = getResourceTasks(resourceId)
    const totalDays = assignedTasks.reduce((sum, t) => {
      const days = Math.ceil((t.endDate.getTime() - t.startDate.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)
    return Math.min(100, totalDays * 5) // Simplified calculation
  }

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(resource => {
          const load = getResourceLoad(resource.id)
          const resourceTasks = getResourceTasks(resource.id)
          
          return (
            <div key={resource.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                  {resource.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold">{resource.name}</h3>
                  <p className="text-sm text-gray-500">{resource.role}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Charge de travail</span>
                  <span className={load > 80 ? 'text-red-600' : load > 50 ? 'text-amber-600' : 'text-emerald-600'}>
                    {load}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      load > 80 ? 'bg-red-500' : load > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${load}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Tâches assignées ({resourceTasks.length})</p>
                <div className="space-y-1">
                  {resourceTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.color }} />
                      <span className="truncate">{task.name}</span>
                      <span className="text-gray-400 text-xs">{task.progress}%</span>
                    </div>
                  ))}
                  {resourceTasks.length > 3 && (
                    <p className="text-xs text-gray-400">+{resourceTasks.length - 3} autres</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Milestones View Component
function MilestonesView({ 
  tasks, 
  onEditMilestone 
}: { 
  tasks: Task[]
  onEditMilestone: (task: Task) => void
}) {
  const sortedMilestones = [...tasks].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {sortedMilestones.map((milestone, index) => {
            const isPast = milestone.endDate < new Date()
            const isCompleted = milestone.status === 'completed'
            
            return (
              <div key={milestone.id} className="relative flex gap-6 pb-8">
                {/* Marker */}
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-emerald-500 text-white' :
                  isPast ? 'bg-red-500 text-white' :
                  'bg-white border-2 border-gray-300 text-gray-500'
                }`}>
                  {isCompleted ? <Check size={20} /> : <Flag size={20} />}
                </div>

                {/* Content */}
                <div 
                  className="flex-1 bg-white rounded-xl border p-4 hover:shadow-md cursor-pointer transition"
                  onClick={() => onEditMilestone(milestone)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{milestone.name}</h3>
                      <p className="text-sm text-gray-500">
                        {milestone.startDate.toLocaleDateString('fr-CA', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      isCompleted ? 'bg-emerald-100 text-emerald-700' :
                      isPast ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {isCompleted ? 'Complété' : isPast ? 'En retard' : 'À venir'}
                    </span>
                  </div>

                  {milestone.dependencies.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">Dépendances requises:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {milestone.dependencies.map(depId => (
                          <span key={depId} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {depId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Task Modal Component
function TaskModal({ 
  task, 
  resources, 
  tasks,
  onSave, 
  onClose 
}: { 
  task: Task | null
  resources: Resource[]
  tasks: Task[]
  onSave: (task: Partial<Task>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<Task>>(task || {
    name: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    assignees: [],
    dependencies: [],
    isMilestone: false,
    color: '#3B82F6'
  })

  const handleSubmit = () => {
    if (!form.name) {
      alert('Veuillez entrer un nom de tâche')
      return
    }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Nom de la tâche"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date début</label>
              <input
                type="date"
                value={form.startDate?.toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, startDate: new Date(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date fin</label>
              <input
                type="date"
                value={form.endDate?.toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, endDate: new Date(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priorité</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="critical">Critique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Couleur</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isMilestone}
                onChange={(e) => setForm({ ...form, isMilestone: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">C'est un jalon (milestone)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assignés</label>
            <div className="flex flex-wrap gap-2">
              {resources.map(resource => (
                <button
                  key={resource.id}
                  onClick={() => {
                    const assignees = form.assignees || []
                    setForm({
                      ...form,
                      assignees: assignees.includes(resource.id)
                        ? assignees.filter(a => a !== resource.id)
                        : [...assignees, resource.id]
                    })
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    form.assignees?.includes(resource.id)
                      ? 'bg-teal-100 text-teal-700 border border-teal-300'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {resource.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dépendances</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {tasks.filter(t => t.id !== task?.id).map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    const deps = form.dependencies || []
                    setForm({
                      ...form,
                      dependencies: deps.includes(t.id)
                        ? deps.filter(d => d !== t.id)
                        : [...deps, t.id]
                    })
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    form.dependencies?.includes(t.id)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            {task ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
