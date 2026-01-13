import React, { useState } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Plus, Filter, Download,
  Clock, Users, AlertTriangle, CheckCircle, Flag, Link2,
  ZoomIn, ZoomOut, Maximize2, Settings, MoreVertical, Edit
} from 'lucide-react';

interface Task {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  assignee: string;
  dependencies: string[];
  isMilestone: boolean;
  isCritical: boolean;
  color: string;
  children?: Task[];
}

const CalendrierModule: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week' | 'month'>('week');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const [tasks] = useState<Task[]>([
    { 
      id: '1', name: 'Phase 1 - Préparation', start: '2026-01-06', end: '2026-01-24', 
      progress: 100, assignee: 'Équipe A', dependencies: [], isMilestone: false, isCritical: true, color: 'blue',
      children: [
        { id: '1.1', name: 'Permis et autorisations', start: '2026-01-06', end: '2026-01-10', progress: 100, assignee: 'Jean T.', dependencies: [], isMilestone: false, isCritical: true, color: 'blue' },
        { id: '1.2', name: 'Installation chantier', start: '2026-01-13', end: '2026-01-17', progress: 100, assignee: 'Marc D.', dependencies: ['1.1'], isMilestone: false, isCritical: true, color: 'blue' },
        { id: '1.3', name: 'Mobilisation équipements', start: '2026-01-20', end: '2026-01-24', progress: 100, assignee: 'Pierre L.', dependencies: ['1.2'], isMilestone: false, isCritical: false, color: 'blue' },
      ]
    },
    { 
      id: '2', name: 'Phase 2 - Fondations', start: '2026-01-27', end: '2026-02-21', 
      progress: 65, assignee: 'Équipe B', dependencies: ['1'], isMilestone: false, isCritical: true, color: 'green',
      children: [
        { id: '2.1', name: 'Excavation', start: '2026-01-27', end: '2026-02-03', progress: 100, assignee: 'Excavation Inc.', dependencies: ['1.3'], isMilestone: false, isCritical: true, color: 'green' },
        { id: '2.2', name: 'Coffrage fondations', start: '2026-02-03', end: '2026-02-10', progress: 80, assignee: 'Coffrage Pro', dependencies: ['2.1'], isMilestone: false, isCritical: true, color: 'green' },
        { id: '2.3', name: 'Coulée béton', start: '2026-02-10', end: '2026-02-14', progress: 20, assignee: 'Béton Québec', dependencies: ['2.2'], isMilestone: false, isCritical: true, color: 'green' },
        { id: '2.4', name: 'Cure et décoffrage', start: '2026-02-17', end: '2026-02-21', progress: 0, assignee: 'Coffrage Pro', dependencies: ['2.3'], isMilestone: false, isCritical: false, color: 'green' },
      ]
    },
    { 
      id: 'M1', name: '⬥ Jalon: Fondations complétées', start: '2026-02-21', end: '2026-02-21', 
      progress: 0, assignee: '', dependencies: ['2'], isMilestone: true, isCritical: true, color: 'red'
    },
    { 
      id: '3', name: 'Phase 3 - Structure', start: '2026-02-24', end: '2026-04-04', 
      progress: 0, assignee: 'Équipe C', dependencies: ['M1'], isMilestone: false, isCritical: true, color: 'purple',
      children: [
        { id: '3.1', name: 'Structure acier niveau 1', start: '2026-02-24', end: '2026-03-06', progress: 0, assignee: 'Acier MTL', dependencies: ['M1'], isMilestone: false, isCritical: true, color: 'purple' },
        { id: '3.2', name: 'Dalle niveau 1', start: '2026-03-09', end: '2026-03-13', progress: 0, assignee: 'Béton Québec', dependencies: ['3.1'], isMilestone: false, isCritical: true, color: 'purple' },
        { id: '3.3', name: 'Structure acier niveau 2', start: '2026-03-16', end: '2026-03-27', progress: 0, assignee: 'Acier MTL', dependencies: ['3.2'], isMilestone: false, isCritical: true, color: 'purple' },
        { id: '3.4', name: 'Dalle niveau 2', start: '2026-03-30', end: '2026-04-03', progress: 0, assignee: 'Béton Québec', dependencies: ['3.3'], isMilestone: false, isCritical: false, color: 'purple' },
      ]
    },
    { 
      id: '4', name: 'Phase 4 - Enveloppe', start: '2026-04-06', end: '2026-05-15', 
      progress: 0, assignee: 'Équipe D', dependencies: ['3'], isMilestone: false, isCritical: false, color: 'orange'
    },
  ]);

  const getDaysInView = () => {
    const days = [];
    const start = new Date(currentMonth);
    start.setDate(1);
    const daysToShow = zoomLevel === 'day' ? 14 : zoomLevel === 'week' ? 35 : 90;
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = getDaysInView();

  const getTaskPosition = (task: Task) => {
    const startDate = new Date(task.start);
    const endDate = new Date(task.end);
    const viewStart = days[0];
    const viewEnd = days[days.length - 1];
    
    const totalDays = (viewEnd.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24);
    const startOffset = Math.max(0, (startDate.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`
    };
  };

  const flattenTasks = (tasks: Task[], level = 0): (Task & { level: number })[] => {
    return tasks.flatMap(task => [
      { ...task, level },
      ...(task.children ? flattenTasks(task.children, level + 1) : [])
    ]);
  };

  const allTasks = flattenTasks(tasks);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Calendrier de Projet - Gantt
          </h1>
          <p className="text-gray-600">Planification et suivi des phases de construction</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Exporter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={18} />
            Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Durée totale</p>
          <p className="text-2xl font-bold">18 semaines</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Avancement global</p>
          <p className="text-2xl font-bold text-green-600">32%</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Tâches critiques</p>
          <p className="text-2xl font-bold text-red-600">12</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Jalons à venir</p>
          <p className="text-2xl font-bold text-orange-600">4</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Retard estimé</p>
          <p className="text-2xl font-bold text-green-600">0 jours</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border rounded-lg">
            <button 
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentMonth(newDate);
              }}
              className="p-2 hover:bg-gray-100"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 font-medium">
              {currentMonth.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentMonth(newDate);
              }}
              className="p-2 hover:bg-gray-100"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
          >
            Aujourd'hui
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <button 
              onClick={() => setZoomLevel('day')}
              className={`px-3 py-1 text-sm rounded ${zoomLevel === 'day' ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              Jour
            </button>
            <button 
              onClick={() => setZoomLevel('week')}
              className={`px-3 py-1 text-sm rounded ${zoomLevel === 'week' ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              Semaine
            </button>
            <button 
              onClick={() => setZoomLevel('month')}
              className={`px-3 py-1 text-sm rounded ${zoomLevel === 'month' ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              Mois
            </button>
          </div>
          <button className="p-2 border rounded-lg hover:bg-gray-50">
            <Filter size={18} />
          </button>
          <button className="p-2 border rounded-lg hover:bg-gray-50">
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex">
          {/* Task List */}
          <div className="w-80 border-r flex-shrink-0">
            <div className="bg-gray-50 p-3 border-b font-medium text-sm text-gray-500">
              Tâches
            </div>
            <div className="divide-y">
              {allTasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTask(task.id)}
                  className={`p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2 ${
                    selectedTask === task.id ? 'bg-blue-50' : ''
                  }`}
                  style={{ paddingLeft: `${12 + task.level * 20}px` }}
                >
                  {task.isMilestone ? (
                    <Flag size={14} className="text-red-500 flex-shrink-0" />
                  ) : task.isCritical ? (
                    <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle size={14} className="text-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm truncate ${task.level === 0 ? 'font-medium' : ''}`}>
                    {task.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-x-auto">
            {/* Header - Dates */}
            <div className="bg-gray-50 border-b flex sticky top-0">
              {days.filter((_, i) => zoomLevel === 'day' || i % (zoomLevel === 'week' ? 7 : 30) === 0).map((date, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 p-2 text-center text-xs text-gray-500 border-r"
                  style={{ width: zoomLevel === 'day' ? '40px' : zoomLevel === 'week' ? '100px' : '120px' }}
                >
                  {zoomLevel === 'day' 
                    ? date.getDate()
                    : date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
                  }
                </div>
              ))}
            </div>

            {/* Bars */}
            <div className="relative">
              {allTasks.map((task, idx) => {
                const pos = getTaskPosition(task);
                return (
                  <div key={task.id} className="h-10 border-b relative flex items-center">
                    {/* Today line */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{ left: `${((new Date().getTime() - days[0].getTime()) / (days[days.length-1].getTime() - days[0].getTime())) * 100}%` }}
                    />
                    
                    {/* Task bar */}
                    <div
                      className={`absolute h-6 rounded ${
                        task.isMilestone 
                          ? 'w-4 h-4 rotate-45 bg-red-500' 
                          : task.isCritical 
                            ? 'bg-orange-400' 
                            : 'bg-blue-400'
                      }`}
                      style={task.isMilestone ? { left: pos.left, marginLeft: '-8px' } : pos}
                    >
                      {!task.isMilestone && (
                        <>
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-opacity-50 rounded-l"
                            style={{ 
                              width: `${task.progress}%`,
                              backgroundColor: task.isCritical ? '#f97316' : '#3b82f6'
                            }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                            {task.progress > 0 && `${task.progress}%`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white rounded-xl shadow-sm border p-4 flex items-center gap-6">
        <span className="text-sm font-medium text-gray-500">Légende:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-orange-400 rounded" />
          <span className="text-sm">Chemin critique</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-blue-400 rounded" />
          <span className="text-sm">Tâche normale</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rotate-45" />
          <span className="text-sm">Jalon</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 bg-red-500" />
          <span className="text-sm">Aujourd'hui</span>
        </div>
        <div className="flex items-center gap-2">
          <Link2 size={14} className="text-gray-400" />
          <span className="text-sm">Dépendance</span>
        </div>
      </div>
    </div>
  );
};

export default CalendrierModule;
