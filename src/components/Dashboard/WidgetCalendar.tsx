import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'milestone' | 'deadline' | 'meeting' | 'delivery'
  priority: 'low' | 'medium' | 'high'
  color?: string
}

interface WidgetCalendarProps {
  events?: CalendarEvent[]
  onSelectDate?: (date: Date) => void
  onSelectEvent?: (event: CalendarEvent) => void
}

const typeColors = {
  milestone: 'bg-blue-100 text-blue-800 border-blue-300',
  deadline: 'bg-red-100 text-red-800 border-red-300',
  meeting: 'bg-green-100 text-green-800 border-green-300',
  delivery: 'bg-purple-100 text-purple-800 border-purple-300',
}

const priorityIndicators = {
  low: 'border-l-2 border-gray-400',
  medium: 'border-l-2 border-yellow-400',
  high: 'border-l-2 border-red-500',
}

export function WidgetCalendar({ events = [], onSelectDate, onSelectEvent }: WidgetCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach(event => {
      const key = format(event.date, 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(event)
    })
    return map
  }, [events])

  const getDayEvents = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd')
    return eventsByDate.get(key) || []
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onSelectDate?.(date)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="card p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{format(currentDate, 'MMMM yyyy', { locale: fr })}</h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 flex-1 overflow-hidden">
        {days.map(day => {
          const dayEvents = getDayEvents(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toString()}
              onClick={() => isCurrentMonth && handleDateClick(day)}
              className={`
                relative p-1 min-h-[80px] border rounded-lg cursor-pointer transition group
                ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                ${isSelected ? 'ring-2 ring-teal-500 bg-teal-50' : ''}
                ${isToday ? 'border-teal-500' : 'border-gray-200'}
                hover:shadow-md
              `}
            >
              {/* Date number */}
              <div className={`
                text-xs font-semibold mb-1
                ${isToday ? 'text-teal-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
              `}>
                {format(day, 'd')}
              </div>

              {/* Events */}
              <div className="space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectEvent?.(event)
                    }}
                    className={`
                      text-xs px-1 py-0.5 rounded truncate cursor-pointer
                      transition hover:opacity-80
                      ${typeColors[event.type]}
                      ${priorityIndicators[event.priority]}
                    `}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-600 mb-2">
            {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
          </p>
          {getDayEvents(selectedDate).length > 0 ? (
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {getDayEvents(selectedDate).map(event => (
                <div
                  key={event.id}
                  className={`text-xs px-2 py-1 rounded border-l-4 cursor-pointer hover:opacity-80 ${typeColors[event.type]}`}
                  onClick={() => onSelectEvent?.(event)}
                >
                  {event.title}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">Aucun événement</p>
          )}
        </div>
      )}
    </div>
  )
}

export default WidgetCalendar