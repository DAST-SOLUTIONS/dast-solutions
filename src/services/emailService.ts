/**
 * DAST Solutions - Service d'envoi de courriels
 * Utilise Resend pour envoyer les invitations à soumissionner
 */

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || 'demo_key'
const FROM_EMAIL = 'invitations@dast-solutions.ca' // À remplacer par ton domaine vérifié
const FROM_NAME = 'DAST Solutions'

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

/**
 * Générer le template HTML de l'invitation
 */
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
              
              <!-- Salutation -->
              <p style="margin: 0 0 20px; font-size: 16px; color: #111827;">
                Bonjour ${params.contactName ? `<strong>${params.contactName}</strong>` : `<strong>${params.entrepreneurName}</strong>`},
              </p>

              <!-- Introduction -->
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
                        <td style="padding: 5px 0; font-size: 14px; color: #6b7280;">
                          <strong>Numéro :</strong>
                        </td>
                        <td style="padding: 5px 0; font-size: 14px; color: #111827; text-align: right;">
                          ${params.appelOffreNumero}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 14px; color: #6b7280;">
                          <strong>Projet :</strong>
                        </td>
                        <td style="padding: 5px 0; font-size: 14px; color: #111827; text-align: right;">
                          ${params.projectName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 14px; color: #6b7280;">
                          <strong>Date limite :</strong>
                        </td>
                        <td style="padding: 5px 0; font-size: 14px; color: #dc2626; text-align: right; font-weight: 600;">
                          ${formattedDate}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              ${params.description ? `
              <div style="margin: 25px 0;">
                <h3 style="margin: 0 0 10px; font-size: 16px; color: #111827;">Description du projet</h3>
                <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6; white-space: pre-wrap;">
                  ${params.description}
                </p>
              </div>
              ` : ''}

              <!-- Étendue des travaux -->
              <div style="margin: 25px 0;">
                <h3 style="margin: 0 0 10px; font-size: 16px; color: #111827;">Étendue des travaux demandés</h3>
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px;">
                  <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-wrap;">
                    ${params.etendueGravaux}
                  </p>
                </div>
              </div>

              <!-- Documents -->
              ${params.documents && params.documents.length > 0 ? `
              <div style="margin: 25px 0;">
                <h3 style="margin: 0 0 10px; font-size: 16px; color: #111827;">Documents joints</h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  📎 ${params.documents.length} document(s) disponible(s) sur demande
                </p>
              </div>
              ` : ''}

              <!-- Instructions -->
              <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px;">
                <h3 style="margin: 0 0 10px; font-size: 16px; color: #92400e;">
                  ⚠️ Instructions pour soumettre
                </h3>
                <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">
                  Veuillez nous faire parvenir votre soumission détaillée incluant :
                </p>
                <ul style="margin: 10px 0 0; padding-left: 20px; font-size: 14px; color: #78350f; line-height: 1.8;">
                  <li>Prix total incluant les taxes</li>
                  <li>Détail des inclusions</li>
                  <li>Détail des exclusions</li>
                  <li>Conditions et délais</li>
                  <li>Validité de la soumission</li>
                </ul>
              </div>

              <!-- Contact -->
              <div style="margin: 25px 0;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #374151; line-height: 1.6;">
                  Pour toute question ou pour soumettre votre proposition, veuillez répondre à ce courriel.
                </p>
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">
                  Nous avons hâte de recevoir votre soumission et de collaborer avec vous sur ce projet.
                </p>
              </div>

              <!-- Signature -->
              <div style="margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 5px; font-size: 15px; color: #111827; font-weight: 600;">
                  Cordialement,
                </p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  L'équipe DAST Solutions
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 5px; font-size: 12px; color: #6b7280;">
                      <strong>DAST Solutions Inc.</strong>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      Plateforme de gestion de construction pour le Québec
                    </p>
                  </td>
                </tr>
              </table>
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

/**
 * Envoyer une invitation par courriel
 */
export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<boolean> {
  try {
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

    const result = await response.json()
    console.log('Courriel envoyé:', result)
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
    
    // Petit délai pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { success, failed }
}

/**
 * Valider une adresse courriel
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}