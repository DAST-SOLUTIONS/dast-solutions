/**
 * DAST Solutions - Dashboard Configuration Context
 * Gestion des widgets personnalisables
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  x: number
  y: number
  w: number
  h: number
  visible: boolean
  settings?: Record<string, any>
}

export type WidgetType = 
  | 'calendar'
  | 'kpi-revenue'
  | 'kpi-projects'
  | 'kpi-soumissions'
  | 'kpi-factures'
  | 'recent-projects'
  | 'recent-soumissions'
  | 'deadlines'
  | 'revenue-chart'
  | 'project-status'
  | 'weather'
  | 'quick-actions'
  | 'notifications'

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'w1', type: 'kpi-revenue', title: 'Revenus', x: 0, y: 0, w: 1, h: 1, visible: true },
  { id: 'w2', type: 'kpi-projects', title: 'Projets', x: 1, y: 0, w: 1, h: 1, visible: true },
  { id: 'w3', type: 'kpi-soumissions', title: 'Soumissions', x: 2, y: 0, w: 1, h: 1, visible: true },
  { id: 'w4', type: 'kpi-factures', title: 'Factures', x: 3, y: 0, w: 1, h: 1, visible: true },
  { id: 'w5', type: 'calendar', title: 'Calendrier des échéances', x: 0, y: 1, w: 2, h: 2, visible: true },
  { id: 'w6', type: 'deadlines', title: 'Prochaines échéances', x: 2, y: 1, w: 2, h: 2, visible: true },
  { id: 'w7', type: 'recent-projects', title: 'Projets récents', x: 0, y: 3, w: 2, h: 2, visible: true },
  { id: 'w8', type: 'revenue-chart', title: 'Revenus mensuels', x: 2, y: 3, w: 2, h: 2, visible: true },
  { id: 'w9', type: 'quick-actions', title: 'Actions rapides', x: 0, y: 5, w: 4, h: 1, visible: true },
]

export const AVAILABLE_WIDGETS: { type: WidgetType; title: string; description: string; defaultSize: { w: number; h: number } }[] = [
  { type: 'calendar', title: 'Calendrier', description: 'Calendrier des échéances de projets', defaultSize: { w: 2, h: 2 } },
  { type: 'kpi-revenue', title: 'KPI Revenus', description: 'Revenus du mois', defaultSize: { w: 1, h: 1 } },
  { type: 'kpi-projects', title: 'KPI Projets', description: 'Nombre de projets actifs', defaultSize: { w: 1, h: 1 } },
  { type: 'kpi-soumissions', title: 'KPI Soumissions', description: 'Soumissions en attente', defaultSize: { w: 1, h: 1 } },
  { type: 'kpi-factures', title: 'KPI Factures', description: 'Factures impayées', defaultSize: { w: 1, h: 1 } },
  { type: 'recent-projects', title: 'Projets récents', description: 'Liste des derniers projets', defaultSize: { w: 2, h: 2 } },
  { type: 'recent-soumissions', title: 'Soumissions récentes', description: 'Dernières soumissions', defaultSize: { w: 2, h: 2 } },
  { type: 'deadlines', title: 'Échéances', description: 'Prochaines dates limites', defaultSize: { w: 2, h: 2 } },
  { type: 'revenue-chart', title: 'Graphique revenus', description: 'Évolution des revenus', defaultSize: { w: 2, h: 2 } },
  { type: 'project-status', title: 'Statut projets', description: 'Répartition par statut', defaultSize: { w: 2, h: 2 } },
  { type: 'weather', title: 'Météo chantier', description: 'Conditions météo locales', defaultSize: { w: 1, h: 1 } },
  { type: 'quick-actions', title: 'Actions rapides', description: 'Raccourcis vers les actions', defaultSize: { w: 4, h: 1 } },
  { type: 'notifications', title: 'Notifications', description: 'Alertes et notifications', defaultSize: { w: 2, h: 2 } },
]

interface DashboardConfigContextType {
  widgets: WidgetConfig[]
  isEditMode: boolean
  setEditMode: (mode: boolean) => void
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void
  addWidget: (type: WidgetType) => void
  removeWidget: (id: string) => void
  moveWidget: (id: string, x: number, y: number) => void
  resizeWidget: (id: string, w: number, h: number) => void
  resetToDefault: () => void
  saveConfig: () => Promise<void>
}

const DashboardConfigContext = createContext<DashboardConfigContextType | undefined>(undefined)

export function DashboardConfigProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS)
  const [isEditMode, setEditMode] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Charger la configuration au démarrage
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Essayer de charger depuis localStorage d'abord (plus rapide)
      const localConfig = localStorage.getItem(`dashboard-config-${user.id}`)
      if (localConfig) {
        setWidgets(JSON.parse(localConfig))
        return
      }

      // Sinon essayer Supabase
      const { data } = await supabase
        .from('user_settings')
        .select('dashboard_config')
        .eq('user_id', user.id)
        .single()

      if (data?.dashboard_config) {
        setWidgets(data.dashboard_config)
        localStorage.setItem(`dashboard-config-${user.id}`, JSON.stringify(data.dashboard_config))
      }
    } catch (err) {
      console.error('Erreur chargement config dashboard:', err)
    }
  }

  const saveConfig = async () => {
    if (!userId) return

    // Sauvegarder localement
    localStorage.setItem(`dashboard-config-${userId}`, JSON.stringify(widgets))

    // Sauvegarder dans Supabase
    try {
      await supabase
        .from('user_settings')
        .upsert({ 
          user_id: userId, 
          dashboard_config: widgets,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
    } catch (err) {
      console.error('Erreur sauvegarde config:', err)
    }
  }

  const updateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))
  }

  const addWidget = (type: WidgetType) => {
    const template = AVAILABLE_WIDGETS.find(w => w.type === type)
    if (!template) return

    const newWidget: WidgetConfig = {
      id: `w${Date.now()}`,
      type,
      title: template.title,
      x: 0,
      y: Math.max(...widgets.map(w => w.y + w.h), 0),
      w: template.defaultSize.w,
      h: template.defaultSize.h,
      visible: true
    }
    setWidgets(prev => [...prev, newWidget])
  }

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
  }

  const moveWidget = (id: string, x: number, y: number) => {
    updateWidget(id, { x: Math.max(0, x), y: Math.max(0, y) })
  }

  const resizeWidget = (id: string, w: number, h: number) => {
    updateWidget(id, { w: Math.max(1, Math.min(4, w)), h: Math.max(1, Math.min(4, h)) })
  }

  const resetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS)
    if (userId) {
      localStorage.removeItem(`dashboard-config-${userId}`)
    }
  }

  return (
    <DashboardConfigContext.Provider value={{
      widgets,
      isEditMode,
      setEditMode,
      updateWidget,
      addWidget,
      removeWidget,
      moveWidget,
      resizeWidget,
      resetToDefault,
      saveConfig
    }}>
      {children}
    </DashboardConfigContext.Provider>
  )
}

export function useDashboardConfig() {
  const context = useContext(DashboardConfigContext)
  if (!context) {
    throw new Error('useDashboardConfig must be used within DashboardConfigProvider')
  }
  return context
}
