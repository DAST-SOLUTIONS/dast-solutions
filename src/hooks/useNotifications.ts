/**
 * DAST Solutions - Hook Notifications
 * Système de notifications et rappels
 */
import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  type: 'soumission_expire' | 'facture_echeance' | 'facture_retard' | 
        'rbq_expire' | 'ccq_certification_expire' | 'rappel_projet' |
        'nouveau_message' | 'systeme'
  title: string
  message?: string
  reference_type?: string
  reference_id?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  read_at?: string
  dismissed_at?: string
  email_sent: boolean
  scheduled_for: string
  expires_at?: string
  created_at: string
}

export interface NotificationPreferences {
  email_soumission_expire: boolean
  email_facture_echeance: boolean
  email_facture_retard: boolean
  email_rbq_expire: boolean
  email_ccq_expire: boolean
  email_rappel_projet: boolean
  push_enabled: boolean
  days_before_soumission: number
  days_before_facture: number
  days_before_rbq: number
  days_before_ccq: number
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_soumission_expire: true,
  email_facture_echeance: true,
  email_facture_retard: true,
  email_rbq_expire: true,
  email_ccq_expire: true,
  email_rappel_projet: true,
  push_enabled: false,
  days_before_soumission: 7,
  days_before_facture: 3,
  days_before_rbq: 30,
  days_before_ccq: 30
}

export const NOTIFICATION_ICONS: Record<string, string> = {
  soumission_expire: '📋',
  facture_echeance: '💰',
  facture_retard: '⚠️',
  rbq_expire: '🏗️',
  ccq_certification_expire: '👷',
  rappel_projet: '📁',
  nouveau_message: '💬',
  systeme: 'ℹ️'
}

export const NOTIFICATION_COLORS: Record<string, string> = {
  low: '#6B7280',
  normal: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444'
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .lte('scheduled_for', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      setNotifications(data || [])
      setUnreadCount((data || []).filter(n => !n.read_at).length)
    } catch (err) {
      console.error('Erreur chargement notifications:', err)
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  // Charger les préférences
  const fetchPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...data })
      }
    } catch {
      // Utiliser les valeurs par défaut
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    fetchPreferences()

    // Abonnement temps réel
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNotifications, fetchPreferences])

  // Marquer comme lu
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
      return true
    } catch (err) {
      console.error('Erreur marquer lu:', err)
      return false
    }
  }, [])

  // Marquer tout comme lu
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
      setUnreadCount(0)
      return true
    } catch (err) {
      console.error('Erreur marquer tout lu:', err)
      return false
    }
  }, [])

  // Rejeter une notification
  const dismiss = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== id))
      return true
    } catch (err) {
      console.error('Erreur rejeter notification:', err)
      return false
    }
  }, [])

  // Sauvegarder les préférences
  const savePreferences = useCallback(async (prefs: Partial<NotificationPreferences>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const newPrefs = { ...preferences, ...prefs }

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...newPrefs,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error

      setPreferences(newPrefs)
      return true
    } catch (err) {
      console.error('Erreur sauvegarde préférences:', err)
      return false
    }
  }, [preferences])

  // Créer une notification (pour usage interne)
  const createNotification = useCallback(async (notification: {
    type: Notification['type']
    title: string
    message?: string
    reference_type?: string
    reference_id?: string
    priority?: Notification['priority']
    scheduled_for?: string
  }): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          reference_type: notification.reference_type,
          reference_id: notification.reference_id,
          priority: notification.priority || 'normal',
          scheduled_for: notification.scheduled_for || new Date().toISOString()
        })

      if (error) throw error

      await fetchNotifications()
      return true
    } catch (err) {
      console.error('Erreur création notification:', err)
      return false
    }
  }, [fetchNotifications])

  // Générer les rappels automatiques
  const generateReminders = useCallback(async (): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return 0

      let created = 0

      // Soumissions qui expirent
      if (preferences.email_soumission_expire) {
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + preferences.days_before_soumission)

        const { data: soumissions } = await supabase
          .from('soumissions')
          .select('id, soumission_number, client_name, date_valid_until')
          .eq('status', 'envoyee')
          .lte('date_valid_until', expirationDate.toISOString())
          .gte('date_valid_until', new Date().toISOString())

        for (const s of soumissions || []) {
          // Vérifier si notification existe déjà
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('reference_id', s.id)
            .eq('type', 'soumission_expire')
            .is('dismissed_at', null)
            .single()

          if (!existing) {
            await createNotification({
              type: 'soumission_expire',
              title: `Soumission ${s.soumission_number} expire bientôt`,
              message: `La soumission pour ${s.client_name} expire le ${new Date(s.date_valid_until).toLocaleDateString('fr-CA')}`,
              reference_type: 'soumission',
              reference_id: s.id,
              priority: 'high'
            })
            created++
          }
        }
      }

      // Factures en retard
      if (preferences.email_facture_retard) {
        const { data: factures } = await supabase
          .from('factures')
          .select('id, facture_number, client_name, date_echeance, balance_due')
          .in('status', ['envoyee', 'partielle'])
          .lt('date_echeance', new Date().toISOString())

        for (const f of factures || []) {
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('reference_id', f.id)
            .eq('type', 'facture_retard')
            .is('dismissed_at', null)
            .single()

          if (!existing) {
            await createNotification({
              type: 'facture_retard',
              title: `Facture ${f.facture_number} en retard`,
              message: `Montant dû: ${f.balance_due.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}`,
              reference_type: 'facture',
              reference_id: f.id,
              priority: 'urgent'
            })
            created++
          }
        }
      }

      // Licences RBQ qui expirent
      if (preferences.email_rbq_expire) {
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + preferences.days_before_rbq)

        const { data: entrepreneurs } = await supabase
          .from('entrepreneurs')
          .select('id, nom, rbq_date_expiration')
          .lte('rbq_date_expiration', expirationDate.toISOString())
          .gte('rbq_date_expiration', new Date().toISOString())

        for (const e of entrepreneurs || []) {
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('reference_id', e.id)
            .eq('type', 'rbq_expire')
            .is('dismissed_at', null)
            .single()

          if (!existing) {
            await createNotification({
              type: 'rbq_expire',
              title: `Licence RBQ expire: ${e.nom}`,
              message: `La licence expire le ${new Date(e.rbq_date_expiration).toLocaleDateString('fr-CA')}`,
              reference_type: 'entrepreneur',
              reference_id: e.id,
              priority: 'high'
            })
            created++
          }
        }
      }

      return created
    } catch (err) {
      console.error('Erreur génération rappels:', err)
      return 0
    }
  }, [preferences, createNotification])

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    savePreferences,
    createNotification,
    generateReminders,
    refetch: fetchNotifications
  }
}

export default useNotifications
