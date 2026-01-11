/**
 * DAST Solutions - Service d'Alertes Automatiques
 * Détection et génération d'alertes basées sur les règles
 */
import { supabase } from '@/lib/supabase'

// Types
export interface AlertData {
  type: 'warning' | 'error' | 'info' | 'success'
  category: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  projectId?: string
  projectName?: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

export interface AlertRule {
  id: string
  category: string
  conditionType: string
  threshold: number
  thresholdUnit: string
  isActive: boolean
  priority: string
  notifyEmail: boolean
  notifyPush: boolean
  notifyInApp: boolean
}

class AlertService {
  private userId: string | null = null
  private rules: AlertRule[] = []
  private checkInterval: NodeJS.Timeout | null = null

  // Initialiser le service
  async initialize(userId: string) {
    this.userId = userId
    await this.loadRules()
    this.startPeriodicCheck()
  }

  // Charger les règles d'alerte
  async loadRules() {
    if (!this.userId) return

    try {
      const { data } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('user_id', this.userId)
        .eq('is_active', true)

      if (data) {
        this.rules = data.map(r => ({
          id: r.id,
          category: r.category,
          conditionType: r.condition_type,
          threshold: r.threshold,
          thresholdUnit: r.threshold_unit,
          isActive: r.is_active,
          priority: r.priority,
          notifyEmail: r.notify_email,
          notifyPush: r.notify_push,
          notifyInApp: r.notify_in_app
        }))
      }
    } catch (err) {
      console.error('Erreur chargement règles:', err)
    }
  }

  // Démarrer les vérifications périodiques
  startPeriodicCheck(intervalMinutes: number = 15) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    // Première vérification immédiate
    this.runAllChecks()

    // Vérifications périodiques
    this.checkInterval = setInterval(() => {
      this.runAllChecks()
    }, intervalMinutes * 60 * 1000)
  }

  // Arrêter les vérifications
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  // Exécuter toutes les vérifications
  async runAllChecks() {
    if (!this.userId) return

    console.log('[AlertService] Running checks...')

    await Promise.all([
      this.checkBudgets(),
      this.checkDeadlines(),
      this.checkPayments(),
      this.checkProjectSchedule(),
      this.checkDocuments()
    ])
  }

  // Vérifier les budgets
  async checkBudgets() {
    if (!this.userId) return

    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, budget, actual_cost')
        .eq('user_id', this.userId)
        .eq('status', 'in_progress')

      if (!projects) return

      for (const project of projects) {
        if (!project.budget || project.budget === 0) continue

        const usagePercent = (project.actual_cost / project.budget) * 100

        // Règle 85%
        if (usagePercent >= 85 && usagePercent < 100) {
          await this.createAlertIfNotExists({
            type: 'warning',
            category: 'budget',
            title: 'Budget à 85%',
            message: `Le projet ${project.name} atteint ${usagePercent.toFixed(0)}% du budget`,
            priority: 'high',
            projectId: project.id,
            projectName: project.name,
            actionUrl: `/project/${project.id}/budget`,
            actionLabel: 'Voir budget',
            metadata: { budgetPercent: usagePercent }
          }, `budget_85_${project.id}`)
        }

        // Règle 100%
        if (usagePercent >= 100) {
          const overrun = project.actual_cost - project.budget
          await this.createAlertIfNotExists({
            type: 'error',
            category: 'budget',
            title: 'Dépassement budget',
            message: `Le projet ${project.name} a dépassé le budget de ${overrun.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}`,
            priority: 'critical',
            projectId: project.id,
            projectName: project.name,
            actionUrl: `/project/${project.id}/budget`,
            actionLabel: 'Voir budget',
            metadata: { budgetPercent: usagePercent, overrun }
          }, `budget_100_${project.id}`)
        }
      }
    } catch (err) {
      console.error('Erreur vérification budgets:', err)
    }
  }

  // Vérifier les échéances soumissions
  async checkDeadlines() {
    if (!this.userId) return

    try {
      const { data: soumissions } = await supabase
        .from('soumissions')
        .select('id, soumission_number, project_name, deadline')
        .eq('user_id', this.userId)
        .eq('status', 'brouillon')
        .not('deadline', 'is', null)

      if (!soumissions) return

      const now = new Date()

      for (const soum of soumissions) {
        if (!soum.deadline) continue

        const deadline = new Date(soum.deadline)
        const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntil <= 0) {
          await this.createAlertIfNotExists({
            type: 'error',
            category: 'soumission',
            title: 'Échéance dépassée',
            message: `Soumission ${soum.soumission_number} a dépassé l'échéance`,
            priority: 'critical',
            actionUrl: `/soumission/${soum.id}`,
            actionLabel: 'Voir soumission',
            metadata: { daysOverdue: Math.abs(daysUntil) }
          }, `deadline_expired_${soum.id}`)
        } else if (daysUntil <= 3) {
          await this.createAlertIfNotExists({
            type: 'warning',
            category: 'soumission',
            title: 'Échéance proche',
            message: `Soumission ${soum.soumission_number} expire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`,
            priority: 'high',
            actionUrl: `/soumission/${soum.id}`,
            actionLabel: 'Voir soumission',
            metadata: { daysUntil }
          }, `deadline_3d_${soum.id}`)
        } else if (daysUntil <= 7) {
          await this.createAlertIfNotExists({
            type: 'info',
            category: 'soumission',
            title: 'Échéance à 7 jours',
            message: `Soumission ${soum.soumission_number} expire dans ${daysUntil} jours`,
            priority: 'medium',
            actionUrl: `/soumission/${soum.id}`,
            actionLabel: 'Voir soumission',
            metadata: { daysUntil }
          }, `deadline_7d_${soum.id}`)
        }
      }
    } catch (err) {
      console.error('Erreur vérification échéances:', err)
    }
  }

  // Vérifier les paiements en retard
  async checkPayments() {
    if (!this.userId) return

    try {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, total, due_date, client_name')
        .eq('user_id', this.userId)
        .in('status', ['sent', 'overdue'])

      if (!invoices) return

      const now = new Date()

      for (const invoice of invoices) {
        if (!invoice.due_date) continue

        const dueDate = new Date(invoice.due_date)
        const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysOverdue > 0) {
          await this.createAlertIfNotExists({
            type: 'warning',
            category: 'payment',
            title: 'Paiement en retard',
            message: `Facture ${invoice.invoice_number} de ${invoice.total?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} en retard de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`,
            priority: daysOverdue > 30 ? 'critical' : daysOverdue > 14 ? 'high' : 'medium',
            actionUrl: '/factures',
            actionLabel: 'Voir facture',
            metadata: { daysOverdue, amount: invoice.total }
          }, `payment_overdue_${invoice.id}`)
        }
      }
    } catch (err) {
      console.error('Erreur vérification paiements:', err)
    }
  }

  // Vérifier les retards de projet
  async checkProjectSchedule() {
    if (!this.userId) return

    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, end_date, estimated_completion')
        .eq('user_id', this.userId)
        .eq('status', 'in_progress')

      if (!projects) return

      const now = new Date()

      for (const project of projects) {
        const endDate = project.estimated_completion || project.end_date
        if (!endDate) continue

        const deadline = new Date(endDate)
        const daysBehind = Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))

        if (daysBehind > 7) {
          await this.createAlertIfNotExists({
            type: 'warning',
            category: 'project',
            title: 'Retard projet',
            message: `Le projet ${project.name} a ${daysBehind} jours de retard`,
            priority: daysBehind > 30 ? 'high' : 'medium',
            projectId: project.id,
            projectName: project.name,
            actionUrl: `/project/${project.id}`,
            actionLabel: 'Voir projet',
            metadata: { daysBehind }
          }, `project_delay_${project.id}`)
        }
      }
    } catch (err) {
      console.error('Erreur vérification projets:', err)
    }
  }

  // Vérifier les documents expirés
  async checkDocuments() {
    if (!this.userId) return

    try {
      // Vérifier licences RBQ, assurances, etc.
      const { data: licenses } = await supabase
        .from('rbq_licenses')
        .select('id, license_number, expiry_date, company_name')
        .eq('user_id', this.userId)

      if (!licenses) return

      const now = new Date()

      for (const license of licenses) {
        if (!license.expiry_date) continue

        const expiryDate = new Date(license.expiry_date)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry <= 0) {
          await this.createAlertIfNotExists({
            type: 'error',
            category: 'document',
            title: 'Licence expirée',
            message: `Licence RBQ ${license.license_number} est expirée`,
            priority: 'critical',
            actionUrl: '/entrepreneurs/rbq',
            actionLabel: 'Renouveler',
            metadata: { daysExpired: Math.abs(daysUntilExpiry) }
          }, `license_expired_${license.id}`)
        } else if (daysUntilExpiry <= 30) {
          await this.createAlertIfNotExists({
            type: 'warning',
            category: 'document',
            title: 'Licence bientôt expirée',
            message: `Licence RBQ expire dans ${daysUntilExpiry} jours`,
            priority: 'medium',
            actionUrl: '/entrepreneurs/rbq',
            actionLabel: 'Renouveler',
            metadata: { daysUntilExpiry }
          }, `license_expiring_${license.id}`)
        }
      }
    } catch (err) {
      console.error('Erreur vérification documents:', err)
    }
  }

  // Créer une alerte si elle n'existe pas déjà
  async createAlertIfNotExists(alertData: AlertData, uniqueKey: string) {
    if (!this.userId) return

    try {
      // Vérifier si alerte similaire existe (non résolue, dernières 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const { data: existing } = await supabase
        .from('alerts')
        .select('id')
        .eq('user_id', this.userId)
        .eq('dismissed', false)
        .ilike('metadata->>unique_key', uniqueKey)
        .gte('created_at', oneDayAgo)
        .limit(1)

      if (existing && existing.length > 0) {
        return // Alerte similaire existe déjà
      }

      // Créer la nouvelle alerte
      await supabase
        .from('alerts')
        .insert({
          user_id: this.userId,
          type: alertData.type,
          category: alertData.category,
          title: alertData.title,
          message: alertData.message,
          priority: alertData.priority,
          project_id: alertData.projectId,
          project_name: alertData.projectName,
          action_url: alertData.actionUrl,
          action_label: alertData.actionLabel,
          read: false,
          dismissed: false,
          metadata: { ...alertData.metadata, unique_key: uniqueKey }
        })

      console.log(`[AlertService] Created alert: ${alertData.title}`)

      // Envoyer notifications si configurées
      // TODO: Intégrer avec service email/push

    } catch (err) {
      console.error('Erreur création alerte:', err)
    }
  }

  // Créer une alerte manuellement (pour événements ponctuels)
  async createAlert(alertData: AlertData) {
    if (!this.userId) return

    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          user_id: this.userId,
          type: alertData.type,
          category: alertData.category,
          title: alertData.title,
          message: alertData.message,
          priority: alertData.priority,
          project_id: alertData.projectId,
          project_name: alertData.projectName,
          action_url: alertData.actionUrl,
          action_label: alertData.actionLabel,
          read: false,
          dismissed: false,
          metadata: alertData.metadata
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur création alerte:', err)
      throw err
    }
  }

  // Marquer comme lu
  async markAsRead(alertId: string) {
    if (!this.userId) return

    await supabase
      .from('alerts')
      .update({ read: true })
      .eq('id', alertId)
      .eq('user_id', this.userId)
  }

  // Supprimer (dismiss)
  async dismiss(alertId: string) {
    if (!this.userId) return

    await supabase
      .from('alerts')
      .update({ dismissed: true })
      .eq('id', alertId)
      .eq('user_id', this.userId)
  }

  // Compter les alertes non lues
  async getUnreadCount(): Promise<number> {
    if (!this.userId) return 0

    try {
      const { count } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('read', false)
        .eq('dismissed', false)

      return count || 0
    } catch {
      return 0
    }
  }
}

// Instance singleton
export const alertService = new AlertService()

// Hook pour utiliser le service
export function useAlertService() {
  return alertService
}
