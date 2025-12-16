/**
 * DAST Solutions - Service RBQ Amélioré
 * Utilise l'Edge Function Supabase pour vérification réelle
 */
import { supabase } from '@/lib/supabase'

export interface RBQVerificationResult {
  success: boolean
  verified: boolean
  data?: {
    licence: string
    nom: string
    nomLegal?: string
    status: 'valide' | 'suspendu' | 'expire' | 'invalide' | 'non_trouve'
    categories: string[]
    dateEmission?: string
    dateExpiration?: string
    adresse?: string
    ville?: string
    region?: string
  }
  error?: string
  source: 'rbq_api' | 'scraping' | 'cache' | 'edge_function'
  checkedAt: string
}

/**
 * Vérifie une licence RBQ via l'Edge Function
 */
export async function verifyRBQLicenseAPI(licenceNumber: string): Promise<RBQVerificationResult> {
  const cleanedLicence = licenceNumber.replace(/\D/g, '')
  
  if (!cleanedLicence || cleanedLicence.length < 8) {
    return {
      success: false,
      verified: false,
      error: 'Numéro de licence invalide. Format attendu: 8-10 chiffres.',
      source: 'edge_function',
      checkedAt: new Date().toISOString()
    }
  }

  try {
    // Appeler l'Edge Function Supabase
    const { data, error } = await supabase.functions.invoke('verify-rbq', {
      body: { licence: cleanedLicence }
    })

    if (error) {
      throw error
    }

    return data as RBQVerificationResult
  } catch (error) {
    console.error('Erreur Edge Function RBQ:', error)
    
    // Fallback: vérification locale simplifiée
    return fallbackVerification(cleanedLicence)
  }
}

/**
 * Vérification locale (fallback si Edge Function indisponible)
 */
function fallbackVerification(licence: string): RBQVerificationResult {
  const formatted = formatLicence(licence)
  const isValidFormat = licence.length >= 8 && licence.length <= 12
  
  return {
    success: true,
    verified: false,
    data: {
      licence: formatted,
      nom: 'Vérification manuelle requise',
      status: isValidFormat ? 'valide' : 'invalide',
      categories: []
    },
    error: 'Edge Function indisponible. Vérifiez manuellement sur rbq.gouv.qc.ca',
    source: 'cache',
    checkedAt: new Date().toISOString()
  }
}

/**
 * Formate un numéro de licence RBQ
 */
export function formatLicence(licence: string): string {
  const clean = licence.replace(/\D/g, '')
  if (clean.length >= 10) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 10)}`
  } else if (clean.length >= 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}`
  }
  return clean
}

/**
 * Met à jour un entrepreneur avec le résultat de vérification RBQ
 */
export async function updateEntrepreneurRBQStatus(
  entrepreneurId: string,
  verificationResult: RBQVerificationResult
): Promise<boolean> {
  if (!verificationResult.data) {
    return false
  }

  try {
    const { error } = await supabase
      .from('entrepreneurs')
      .update({
        rbq_status: verificationResult.data.status,
        rbq_date_verification: verificationResult.checkedAt,
        rbq_date_expiration: verificationResult.data.dateExpiration,
        rbq_categories: verificationResult.data.categories,
        updated_at: new Date().toISOString()
      })
      .eq('id', entrepreneurId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erreur mise à jour entrepreneur RBQ:', error)
    return false
  }
}

/**
 * Vérifie plusieurs licences en lot
 */
export async function batchVerifyRBQ(
  licences: string[]
): Promise<Map<string, RBQVerificationResult>> {
  const results = new Map<string, RBQVerificationResult>()
  
  // Limiter à 5 vérifications simultanées pour ne pas surcharger
  const batchSize = 5
  
  for (let i = 0; i < licences.length; i += batchSize) {
    const batch = licences.slice(i, i + batchSize)
    
    const batchResults = await Promise.all(
      batch.map(async (licence) => {
        const result = await verifyRBQLicenseAPI(licence)
        return { licence, result }
      })
    )
    
    batchResults.forEach(({ licence, result }) => {
      results.set(licence, result)
    })
    
    // Pause entre les lots
    if (i + batchSize < licences.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return results
}

/**
 * Lien direct vers la page RBQ
 */
export function getRBQVerificationUrl(licence?: string): string {
  const baseUrl = 'https://www.rbq.gouv.qc.ca/services-en-ligne/registre-des-detenteurs-de-licence/'
  return baseUrl
}

/**
 * Catégories RBQ
 */
export const RBQ_CATEGORIES = [
  { code: '1.1.1', description: 'Bâtiments résidentiels neufs de 4 logements ou moins' },
  { code: '1.1.2', description: 'Bâtiments résidentiels neufs de tout genre' },
  { code: '1.2', description: 'Entrepreneur spécialisé - Résidentiel' },
  { code: '2.1', description: 'Bâtiments publics - Entrepreneur général' },
  { code: '2.2', description: 'Bâtiments publics - Entrepreneur spécialisé' },
  { code: '3.1', description: 'Génie civil et voirie - Entrepreneur général' },
  { code: '3.2', description: 'Génie civil et voirie - Entrepreneur spécialisé' },
  { code: '4.1', description: 'Travaux connexes - Entrepreneur spécialisé' },
]

/**
 * Sous-catégories de spécialité
 */
export const RBQ_SPECIALTIES = [
  { code: '6.1', description: 'Isolation thermique' },
  { code: '7', description: 'Revêtements extérieurs' },
  { code: '8', description: 'Revêtements de toiture' },
  { code: '9', description: 'Charpentes et structures' },
  { code: '10', description: 'Fondations' },
  { code: '11', description: 'Peinture' },
  { code: '12', description: 'Revêtements souples' },
  { code: '13', description: 'Carrelage et céramique' },
  { code: '14', description: 'Menuiserie' },
  { code: '15', description: 'Systèmes de plomberie' },
  { code: '16', description: 'Systèmes d\'électricité' },
  { code: '17', description: 'Systèmes de chauffage' },
  { code: '18', description: 'Systèmes de ventilation' },
]

/**
 * Obtient la description d'une catégorie RBQ
 */
export function getRBQCategoryDescription(code: string): string {
  const category = [...RBQ_CATEGORIES, ...RBQ_SPECIALTIES].find(c => c.code === code)
  return category?.description || `Catégorie ${code}`
}
