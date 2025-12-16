/**
 * DAST Solutions - Hook Dashboard Stats
 * Statistiques temps réel depuis Supabase
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface DashboardStats {
  // KPIs principaux
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalSoumissions: number
  acceptedSoumissions: number
  pendingSoumissions: number
  totalRevenue: number
  pendingRevenue: number
  conversionRate: number
  
  // Entrepreneurs & Personnel
  totalEntrepreneurs: number
  favoriteEntrepreneurs: number
  totalPersonnel: number
  activePersonnel: number
  expiringCertifications: number
  
  // Tendances (vs mois dernier)
  projectsTrend: number
  revenueTrend: number
  soumissionsTrend: number
  conversionTrend: number
}

export interface ChartData {
  revenue: Array<{
    month: string
    soumissions: number
    acceptees: number
  }>
  projects: Array<{
    month: string
    nouveaux: number
    termines: number
    en_cours: number
  }>
  conversion: Array<{
    name: string
    value: number
    color: string
  }>
  byType: Array<{
    type: string
    count: number
    value: number
  }>
}

export interface RecentActivity {
  id: string
  type: 'project' | 'soumission' | 'entrepreneur' | 'personnel'
  title: string
  subtitle: string
  date: string
  status?: string
  value?: number
}

export interface Reminder {
  id: string
  type: 'soumission_expire' | 'certification_expire' | 'rbq_expire' | 'project_deadline'
  title: string
  date: string
  urgency: 'low' | 'medium' | 'high'
  link: string
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Dates pour calculs
      const now = new Date()
      const startOfThisMonth = startOfMonth(now)
      const startOfLastMonth = startOfMonth(subMonths(now, 1))
      const endOfLastMonth = endOfMonth(subMonths(now, 1))

      // === PROJETS ===
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, project_type, project_value, created_at, client_name')
        .eq('user_id', user.id)

      const allProjects = projects || []
      const activeProjects = allProjects.filter(p => p.status === 'en_cours' || p.status === 'active')
      const completedProjects = allProjects.filter(p => p.status === 'termine' || p.status === 'completed')
      
      // Projets ce mois vs mois dernier
      const projectsThisMonth = allProjects.filter(p => new Date(p.created_at) >= startOfThisMonth).length
      const projectsLastMonth = allProjects.filter(p => {
        const d = new Date(p.created_at)
        return d >= startOfLastMonth && d <= endOfLastMonth
      }).length
      const projectsTrend = projectsLastMonth > 0 
        ? Math.round(((projectsThisMonth - projectsLastMonth) / projectsLastMonth) * 100)
        : projectsThisMonth > 0 ? 100 : 0

      // === SOUMISSIONS ===
      const { data: soumissions } = await supabase
        .from('soumissions')
        .select('id, soumission_number, status, total, date_created, date_valid_until, client_name, project_name')

      const allSoumissions = soumissions || []
      const acceptedSoumissions = allSoumissions.filter(s => s.status === 'acceptee')
      const pendingSoumissions = allSoumissions.filter(s => s.status === 'envoyee' || s.status === 'en_attente')
      const refusedSoumissions = allSoumissions.filter(s => s.status === 'refusee')
      const expiredSoumissions = allSoumissions.filter(s => s.status === 'expiree')
      
      const totalRevenue = acceptedSoumissions.reduce((sum, s) => sum + (s.total || 0), 0)
      const pendingRevenue = pendingSoumissions.reduce((sum, s) => sum + (s.total || 0), 0)
      const conversionRate = allSoumissions.length > 0 
        ? Math.round((acceptedSoumissions.length / allSoumissions.length) * 100)
        : 0

      // Soumissions ce mois vs mois dernier
      const soumissionsThisMonth = allSoumissions.filter(s => new Date(s.date_created) >= startOfThisMonth).length
      const soumissionsLastMonth = allSoumissions.filter(s => {
        const d = new Date(s.date_created)
        return d >= startOfLastMonth && d <= endOfLastMonth
      }).length
      const soumissionsTrend = soumissionsLastMonth > 0
        ? Math.round(((soumissionsThisMonth - soumissionsLastMonth) / soumissionsLastMonth) * 100)
        : soumissionsThisMonth > 0 ? 100 : 0

      // Revenue trend
      const revenueThisMonth = allSoumissions
        .filter(s => s.status === 'acceptee' && new Date(s.date_created) >= startOfThisMonth)
        .reduce((sum, s) => sum + (s.total || 0), 0)
      const revenueLastMonth = allSoumissions
        .filter(s => {
          const d = new Date(s.date_created)
          return s.status === 'acceptee' && d >= startOfLastMonth && d <= endOfLastMonth
        })
        .reduce((sum, s) => sum + (s.total || 0), 0)
      const revenueTrend = revenueLastMonth > 0
        ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
        : revenueThisMonth > 0 ? 100 : 0

      // === ENTREPRENEURS ===
      const { data: entrepreneurs } = await supabase
        .from('entrepreneurs')
        .select('id, nom, is_favori, rbq_status, rbq_date_expiration')
        .eq('user_id', user.id)

      const allEntrepreneurs = entrepreneurs || []
      const favoriteEntrepreneurs = allEntrepreneurs.filter(e => e.is_favori)

      // === PERSONNEL CCQ ===
      const { data: personnel } = await supabase
        .from('personnel_ccq')
        .select('id, nom, prenom, status')
        .eq('user_id', user.id)

      const allPersonnel = personnel || []
      const activePersonnel = allPersonnel.filter(p => p.status === 'actif')

      // Certifications expirantes (30 jours)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      const { data: certifications } = await supabase
        .from('personnel_certifications')
        .select('id, nom, date_expiration, personnel_id')
        .lte('date_expiration', thirtyDaysFromNow.toISOString())
        .gte('date_expiration', now.toISOString())

      const expiringCertifications = certifications?.length || 0

      // === SET STATS ===
      setStats({
        totalProjects: allProjects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        totalSoumissions: allSoumissions.length,
        acceptedSoumissions: acceptedSoumissions.length,
        pendingSoumissions: pendingSoumissions.length,
        totalRevenue,
        pendingRevenue,
        conversionRate,
        totalEntrepreneurs: allEntrepreneurs.length,
        favoriteEntrepreneurs: favoriteEntrepreneurs.length,
        totalPersonnel: allPersonnel.length,
        activePersonnel: activePersonnel.length,
        expiringCertifications,
        projectsTrend,
        revenueTrend,
        soumissionsTrend,
        conversionTrend: 0 // À calculer si historique disponible
      })

      // === CHART DATA ===
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(now, 5 - i)
        return {
          date,
          label: format(date, 'MMM', { locale: fr }),
          start: startOfMonth(date),
          end: endOfMonth(date)
        }
      })

      const revenueData = months.map(m => {
        const monthSoumissions = allSoumissions.filter(s => {
          const d = new Date(s.date_created)
          return d >= m.start && d <= m.end
        })
        return {
          month: m.label,
          soumissions: monthSoumissions.reduce((sum, s) => sum + (s.total || 0), 0),
          acceptees: monthSoumissions.filter(s => s.status === 'acceptee').reduce((sum, s) => sum + (s.total || 0), 0)
        }
      })

      const projectsData = months.map(m => {
        const monthProjects = allProjects.filter(p => {
          const d = new Date(p.created_at)
          return d >= m.start && d <= m.end
        })
        return {
          month: m.label,
          nouveaux: monthProjects.length,
          termines: monthProjects.filter(p => p.status === 'termine' || p.status === 'completed').length,
          en_cours: monthProjects.filter(p => p.status === 'en_cours' || p.status === 'active').length
        }
      })

      const conversionData = [
        { name: 'Acceptées', value: acceptedSoumissions.length, color: '#10B981' },
        { name: 'En attente', value: pendingSoumissions.length, color: '#F59E0B' },
        { name: 'Refusées', value: refusedSoumissions.length, color: '#EF4444' },
        { name: 'Expirées', value: expiredSoumissions.length, color: '#6B7280' }
      ].filter(d => d.value > 0)

      // Par type de projet
      const projectTypes = allProjects.reduce((acc, p) => {
        const type = p.project_type || 'Non défini'
        if (!acc[type]) acc[type] = { count: 0, value: 0 }
        acc[type].count++
        acc[type].value += p.project_value || 0
        return acc
      }, {} as Record<string, { count: number; value: number }>)

      const byTypeData = Object.entries(projectTypes).map(([type, data]) => ({
        type,
        count: data.count,
        value: data.value
      }))

      setChartData({
        revenue: revenueData,
        projects: projectsData,
        conversion: conversionData,
        byType: byTypeData
      })

      // === RECENT ACTIVITY ===
      const activities: RecentActivity[] = []
      
      // Derniers projets
      allProjects.slice(0, 3).forEach(p => {
        activities.push({
          id: p.id,
          type: 'project',
          title: p.name,
          subtitle: p.client_name || 'Client non défini',
          date: p.created_at,
          status: p.status,
          value: p.project_value
        })
      })

      // Dernières soumissions
      allSoumissions.slice(0, 3).forEach(s => {
        activities.push({
          id: s.id,
          type: 'soumission',
          title: s.soumission_number,
          subtitle: s.client_name || s.project_name || 'Non défini',
          date: s.date_created,
          status: s.status,
          value: s.total
        })
      })

      // Trier par date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setRecentActivity(activities.slice(0, 5))

      // === REMINDERS ===
      const remindersList: Reminder[] = []

      // Soumissions qui expirent
      const expiringSoumissions = allSoumissions.filter(s => {
        if (!s.date_valid_until || s.status !== 'envoyee') return false
        const expiry = new Date(s.date_valid_until)
        return expiry <= thirtyDaysFromNow && expiry >= now
      })
      
      expiringSoumissions.forEach(s => {
        const daysUntil = Math.ceil((new Date(s.date_valid_until).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        remindersList.push({
          id: s.id,
          type: 'soumission_expire',
          title: `Soumission ${s.soumission_number} expire`,
          date: s.date_valid_until,
          urgency: daysUntil <= 7 ? 'high' : daysUntil <= 14 ? 'medium' : 'low',
          link: '/soumissions'
        })
      })

      // RBQ qui expirent
      const expiringRBQ = allEntrepreneurs.filter(e => {
        if (!e.rbq_date_expiration) return false
        const expiry = new Date(e.rbq_date_expiration)
        return expiry <= thirtyDaysFromNow && expiry >= now
      })

      expiringRBQ.forEach(e => {
        remindersList.push({
          id: e.id,
          type: 'rbq_expire',
          title: `Licence RBQ de ${e.nom} expire`,
          date: e.rbq_date_expiration,
          urgency: 'medium',
          link: '/entrepreneurs/rbq'
        })
      })

      // Certifications
      certifications?.forEach(c => {
        const daysUntil = Math.ceil((new Date(c.date_expiration).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        remindersList.push({
          id: c.id,
          type: 'certification_expire',
          title: `Certification ${c.nom} expire`,
          date: c.date_expiration,
          urgency: daysUntil <= 7 ? 'high' : 'medium',
          link: '/entrepreneurs/personnel'
        })
      })

      remindersList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setReminders(remindersList.slice(0, 5))

      setError(null)
    } catch (err) {
      console.error('Erreur stats dashboard:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    chartData,
    recentActivity,
    reminders,
    loading,
    error,
    refresh: fetchStats
  }
}
