/**
 * DAST Solutions - Service Email
 * Envoi d'emails via Resend avec templates
 */
import { supabase } from '@/lib/supabase'

// Types
interface EmailRecipient {
  email: string
  name?: string
}

interface EmailTemplate {
  subject: string
  html: string
}

// Configuration Resend (à mettre dans .env)
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || ''
const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'noreply@dast-solutions.com'
const FROM_NAME = import.meta.env.VITE_FROM_NAME || 'DAST Solutions'

/**
 * Templates d'email
 */
const TEMPLATES = {
  // Soumission envoyée au client
  soumission_envoyee: (data: {
    clientName: string
    soumissionNumber: string
    total: string
    validUntil: string
    entrepriseName: string
  }): EmailTemplate => ({
    subject: `Soumission ${data.soumissionNumber} - ${data.entrepriseName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d9488, #f97316); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .amount { font-size: 28px; font-weight: bold; color: #0d9488; }
          .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.entrepriseName}</h1>
          </div>
          <div class="content">
            <p>Bonjour ${data.clientName},</p>
            <p>Nous avons le plaisir de vous transmettre notre soumission pour les travaux discutés.</p>
            
            <p><strong>Numéro de soumission:</strong> ${data.soumissionNumber}</p>
            <p><strong>Montant total:</strong> <span class="amount">${data.total}</span></p>
            <p><strong>Valide jusqu'au:</strong> ${data.validUntil}</p>
            
            <p>N'hésitez pas à nous contacter pour toute question.</p>
            
            <p>Cordialement,<br>${data.entrepriseName}</p>
          </div>
          <div class="footer">
            <p>Ce courriel a été envoyé via DAST Solutions</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Facture envoyée
  facture_envoyee: (data: {
    clientName: string
    factureNumber: string
    total: string
    dueDate: string
    entrepriseName: string
  }): EmailTemplate => ({
    subject: `Facture ${data.factureNumber} - ${data.entrepriseName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d9488, #f97316); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .amount { font-size: 28px; font-weight: bold; color: #0d9488; }
          .due-date { color: #dc2626; font-weight: bold; }
          .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.entrepriseName}</h1>
          </div>
          <div class="content">
            <p>Bonjour ${data.clientName},</p>
            <p>Veuillez trouver ci-joint votre facture pour les travaux réalisés.</p>
            
            <p><strong>Numéro de facture:</strong> ${data.factureNumber}</p>
            <p><strong>Montant total:</strong> <span class="amount">${data.total}</span></p>
            <p><strong>Date d'échéance:</strong> <span class="due-date">${data.dueDate}</span></p>
            
            <p>Merci de votre confiance.</p>
            
            <p>Cordialement,<br>${data.entrepriseName}</p>
          </div>
          <div class="footer">
            <p>Ce courriel a été envoyé via DAST Solutions</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Rappel facture
  facture_rappel: (data: {
    clientName: string
    factureNumber: string
    balanceDue: string
    daysOverdue: number
    entrepriseName: string
  }): EmailTemplate => ({
    subject: `Rappel: Facture ${data.factureNumber} - ${data.balanceDue} en souffrance`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fef2f2; padding: 30px; border: 1px solid #fecaca; }
          .amount { font-size: 28px; font-weight: bold; color: #dc2626; }
          .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Rappel de paiement</h1>
          </div>
          <div class="content">
            <p>Bonjour ${data.clientName},</p>
            <p>Nous vous rappelons que la facture suivante est en souffrance depuis <strong>${data.daysOverdue} jours</strong>.</p>
            
            <p><strong>Numéro de facture:</strong> ${data.factureNumber}</p>
            <p><strong>Solde dû:</strong> <span class="amount">${data.balanceDue}</span></p>
            
            <p>Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.</p>
            
            <p>Si vous avez déjà effectué le paiement, veuillez ignorer ce message.</p>
            
            <p>Cordialement,<br>${data.entrepriseName}</p>
          </div>
          <div class="footer">
            <p>Ce courriel a été envoyé via DAST Solutions</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Soumission expire bientôt
  soumission_expire: (data: {
    clientName: string
    soumissionNumber: string
    daysRemaining: number
    entrepriseName: string
  }): EmailTemplate => ({
    subject: `Votre soumission ${data.soumissionNumber} expire dans ${data.daysRemaining} jours`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fffbeb; padding: 30px; border: 1px solid #fcd34d; }
          .days { font-size: 48px; font-weight: bold; color: #f59e0b; text-align: center; }
          .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Rappel</h1>
          </div>
          <div class="content">
            <p>Bonjour ${data.clientName},</p>
            
            <p class="days">${data.daysRemaining} jours</p>
            
            <p style="text-align: center;">Il reste <strong>${data.daysRemaining} jours</strong> avant l'expiration de notre soumission <strong>${data.soumissionNumber}</strong>.</p>
            
            <p>Si vous avez des questions ou souhaitez procéder, n'hésitez pas à nous contacter.</p>
            
            <p>Cordialement,<br>${data.entrepriseName}</p>
          </div>
          <div class="footer">
            <p>Ce courriel a été envoyé via DAST Solutions</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
}

/**
 * Envoie un email via Resend
 */
export async function sendEmail(
  to: EmailRecipient,
  template: keyof typeof TEMPLATES,
  templateData: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Générer le contenu
    const emailContent = TEMPLATES[template](templateData)

    // Appeler l'API Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: to.name ? `${to.name} <${to.email}>` : to.email,
        subject: emailContent.subject,
        html: emailContent.html
      })
    })

    const result = await response.json()

    // Logger dans la BD
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('email_logs').insert({
        user_id: user.id,
        to_email: to.email,
        to_name: to.name,
        subject: emailContent.subject,
        template,
        status: response.ok ? 'sent' : 'failed',
        error_message: response.ok ? null : result.message,
        sent_at: response.ok ? new Date().toISOString() : null
      })
    }

    if (!response.ok) {
      throw new Error(result.message || 'Erreur Resend')
    }

    return { success: true, messageId: result.id }
  } catch (err) {
    console.error('Erreur envoi email:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Envoie une soumission par email
 */
export async function sendSoumissionEmail(
  soumission: {
    id: string
    soumission_number: string
    client_name: string
    client_email: string
    total: number
    date_valid_until: string
  },
  entrepriseName: string
): Promise<{ success: boolean; error?: string }> {
  if (!soumission.client_email) {
    return { success: false, error: 'Email client manquant' }
  }

  return sendEmail(
    { email: soumission.client_email, name: soumission.client_name },
    'soumission_envoyee',
    {
      clientName: soumission.client_name,
      soumissionNumber: soumission.soumission_number,
      total: soumission.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }),
      validUntil: new Date(soumission.date_valid_until).toLocaleDateString('fr-CA'),
      entrepriseName
    }
  )
}

/**
 * Envoie une facture par email
 */
export async function sendFactureEmail(
  facture: {
    id: string
    facture_number: string
    client_name: string
    client_email: string
    total: number
    date_echeance: string
  },
  entrepriseName: string
): Promise<{ success: boolean; error?: string }> {
  if (!facture.client_email) {
    return { success: false, error: 'Email client manquant' }
  }

  return sendEmail(
    { email: facture.client_email, name: facture.client_name },
    'facture_envoyee',
    {
      clientName: facture.client_name,
      factureNumber: facture.facture_number,
      total: facture.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }),
      dueDate: new Date(facture.date_echeance).toLocaleDateString('fr-CA'),
      entrepriseName
    }
  )
}

/**
 * Envoie un rappel de facture
 */
export async function sendFactureRappel(
  facture: {
    facture_number: string
    client_name: string
    client_email: string
    balance_due: number
    date_echeance: string
  },
  entrepriseName: string
): Promise<{ success: boolean; error?: string }> {
  if (!facture.client_email) {
    return { success: false, error: 'Email client manquant' }
  }

  const daysOverdue = Math.floor(
    (new Date().getTime() - new Date(facture.date_echeance).getTime()) / (1000 * 60 * 60 * 24)
  )

  return sendEmail(
    { email: facture.client_email, name: facture.client_name },
    'facture_rappel',
    {
      clientName: facture.client_name,
      factureNumber: facture.facture_number,
      balanceDue: facture.balance_due.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }),
      daysOverdue: Math.max(0, daysOverdue),
      entrepriseName
    }
  )
}

export default {
  sendEmail,
  sendSoumissionEmail,
  sendFactureEmail,
  sendFactureRappel
}
