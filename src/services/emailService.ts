/**
 * DAST Solutions - Service Email COMPLET
 * Invitations, Factures, Soumissions, Rappels
 */
import { supabase } from '@/lib/supabase'

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || ''
const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'noreply@dast-solutions.com'
const FROM_NAME = import.meta.env.VITE_FROM_NAME || 'DAST Solutions'

// =====================================================
// TYPES - INVITATIONS
// =====================================================

export interface SendInvitationEmailParams {
  to: string
  entrepreneurName: string
  contactName?: string
  appelOffreNumero: string
  appelOffreTitre: string
  projectName: string
  description: string
  etendueGravaux: string
  dateLimite: string
  documents?: string[]
}

// =====================================================
// TYPES - EMAILS GÉNÉRAUX
// =====================================================

interface EmailRecipient {
  email: string
  name?: string
}

interface EmailTemplate {
  subject: string
  html: string
}

// =====================================================
// UTILITAIRES
// =====================================================

/**
 * Valider une adresse courriel
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// =====================================================
// TEMPLATE INVITATION
// =====================================================

function generateInvitationTemplate(params: SendInvitationEmailParams): string {
  const formattedDate = new Date(params.dateLimite).toLocaleDateString('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation à soumissionner</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d9488 0%, #f97316 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">DASTCC Central Cloud</h1>
              <p style="margin: 5px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Plateforme de gestion de construction</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #111827;">
                Bonjour ${params.contactName ? `<strong>${params.contactName}</strong>` : `<strong>${params.entrepreneurName}</strong>`},
              </p>

              <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
                Nous avons le plaisir de vous inviter à soumettre une proposition pour le projet suivant :
              </p>

              <!-- Appel d'offres Info Box -->
              <table role="presentation" style="width: 100%; background-color: #f0fdfa; border-left: 4px solid #14b8a6; border-radius: 6px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px; font-size: 18px; color: #0f766e;">
                      ${params.appelOffreTitre}
                    </h2>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 5px 0; font-size: 14px; color: #6b7280;"><strong>Numéro :</strong></td>
                        <td style="padding: 5px 0; font-size: 14px; color: #111827; text-align: right;">${params.appelOffreNumero}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 14px; color: #6b7280;"><strong>Projet :</strong></td>
                        <td style="padding: 5px 0; font-size: 14px; color: #111827; text-align: right;">${params.projectName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 14px; color: #6b7280;"><strong>Date limite :</strong></td>
                        <td style="padding: 5px 0; font-size: 14px; color: #dc2626; text-align: right; font-weight: 600;">${formattedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${params.description ? `
              <div style="margin: 25px 0;">
                <h3 style="margin: 0 0 10px; font-size: 16px; color: #111827;">Description du projet</h3>
                <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${params.description}</p>
              </div>
              ` : ''}

              <div style="margin: 25px 0;">
                <h3 style="margin: 0 0 10px; font-size: 16px; color: #111827;">Étendue des travaux demandés</h3>
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px;">
                  <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${params.etendueGravaux}</p>
                </div>
              </div>

              <div style="margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 5px; font-size: 15px; color: #111827; font-weight: 600;">Cordialement,</p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">L'équipe DAST Solutions</p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;"><strong>DAST Solutions Inc.</strong></p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">Plateforme de gestion de construction pour le Québec</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// =====================================================
// TEMPLATES FACTURES/SOUMISSIONS
// =====================================================

const TEMPLATES = {
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${data.entrepriseName}</h1></div>
          <div class="content">
            <p>Bonjour ${data.clientName},</p>
            <p>Nous avons le plaisir de vous transmettre notre soumission pour les travaux discutés.</p>
            <p><strong>Numéro de soumission:</strong> ${data.soumissionNumber}</p>
            <p><strong>Montant total:</strong> <span class="amount">${data.total}</span></p>
            <p><strong>Valide jusqu'au:</strong> ${data.validUntil}</p>
            <p>Cordialement,<br>${data.entrepriseName}</p>
          </div>
          <div class="footer"><p>Ce courriel a été envoyé via DAST Solutions</p></div>
        </div>
      </body>
      </html>
    `
  }),

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
          <div class="header"><h1>${data.entrepriseName}</h1></div>
          <div class="content">
            <p>Bonjour ${data.clientName},</p>
            <p>Veuillez trouver ci-joint votre facture pour les travaux réalisés.</p>
            <p><strong>Numéro de facture:</strong> ${data.factureNumber}</p>
            <p><strong>Montant total:</strong> <span class="amount">${data.total}</span></p>
            <p><strong>Date d'échéance:</strong> <span class="due-date">${data.dueDate}</span></p>
            <p>Merci de votre confiance.</p>
            <p>Cordialement,<br>${data.entrepriseName}</p>
          </div>
          <div class="footer"><p>Ce courriel a été envoyé via DAST Solutions</p></div>
        </div>
      </body>
      </html>
    `
  }),

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
          <div class="header"><h1>⚠️ Rappel de paiement</h1></div>
          <div class="content">
            <p>Bonjour ${data.clientName},</p>
            <p>Nous vous rappelons que la facture suivante est en souffrance depuis <strong>${data.daysOverdue} jours</strong>.</p>
            <p><strong>Numéro de facture:</strong> ${data.factureNumber}</p>
            <p><strong>Solde dû:</strong> <span class="amount">${data.balanceDue}</span></p>
            <p>Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.</p>
            <p>Cordialement,<br>${data.entrepriseName}</p>
          </div>
          <div class="footer"><p>Ce courriel a été envoyé via DAST Solutions</p></div>
        </div>
      </body>
      </html>
    `
  })
}

// =====================================================
// FONCTIONS D'ENVOI - INVITATIONS
// =====================================================

/**
 * Envoyer une invitation par courriel
 */
export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<boolean> {
  try {
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY non configuré')
      return false
    }

    const htmlContent = generateInvitationTemplate(params)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: params.to,
        subject: `Invitation à soumissionner - ${params.appelOffreTitre}`,
        html: htmlContent
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Erreur Resend:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erreur lors de l\'envoi du courriel:', error)
    return false
  }
}

/**
 * Envoyer plusieurs invitations en batch
 */
export async function sendBatchInvitations(
  invitations: SendInvitationEmailParams[]
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const invitation of invitations) {
    const sent = await sendInvitationEmail(invitation)
    if (sent) {
      success++
    } else {
      failed++
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { success, failed }
}

// =====================================================
// FONCTIONS D'ENVOI - FACTURES/SOUMISSIONS
// =====================================================

/**
 * Envoie un email via Resend
 */
export async function sendEmail(
  to: EmailRecipient,
  template: keyof typeof TEMPLATES,
  templateData: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY non configuré' }
    }

    const emailContent = TEMPLATES[template](templateData)

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
      }).catch(() => {}) // Ignore si table n'existe pas encore
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
  sendInvitationEmail,
  sendBatchInvitations,
  sendSoumissionEmail,
  sendFactureEmail,
  sendFactureRappel,
  isValidEmail
}
