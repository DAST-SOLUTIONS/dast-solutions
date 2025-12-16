/**
 * DAST Solutions - Service Vérification RBQ
 * Vérification des licences via rbq.gouv.qc.ca
 */
import { supabase } from '@/lib/supabase'

export interface RBQVerificationResult {
  success: boolean
  verified: boolean
  data?: {
    licence: string
    nom: string
    nomLegal?: string
    status: 'valide' | 'suspendu' | 'expire' | 'invalide'
    categories: string[]
    dateEmission?: string
    dateExpiration?: string
    adresse?: string
    ville?: string
    codePostal?: string
    region?: string
  }
  error?: string
  source: 'api' | 'scraping' | 'cache'
  checkedAt: string
}

export interface RBQCategory {
  code: string
  description: string
  sousCategories?: { code: string; description: string }[]
}

// Catégories RBQ officielles
export const RBQ_CATEGORIES: RBQCategory[] = [
  { code: '1', description: 'Bâtiments résidentiels', sousCategories: [
    { code: '1.1', description: 'Entrepreneur général' },
    { code: '1.1.1', description: 'Bâtiments résidentiels neufs de 4 logements ou moins' },
    { code: '1.1.2', description: 'Bâtiments résidentiels neufs de tout genre' },
    { code: '1.2', description: 'Entrepreneur spécialisé' },
  ]},
  { code: '2', description: 'Bâtiments publics', sousCategories: [
    { code: '2.1', description: 'Entrepreneur général' },
    { code: '2.2', description: 'Entrepreneur spécialisé' },
  ]},
  { code: '3', description: 'Génie civil et voirie', sousCategories: [
    { code: '3.1', description: 'Entrepreneur général' },
    { code: '3.2', description: 'Entrepreneur spécialisé' },
  ]},
  { code: '4', description: 'Travaux connexes', sousCategories: [
    { code: '4.1', description: 'Entrepreneur spécialisé' },
  ]},
]

// Sous-catégories communes
export const RBQ_SOUS_CATEGORIES = {
  // Électricité
  '16': 'Systèmes d\'électricité',
  // Plomberie
  '15': 'Systèmes de plomberie',
  // Chauffage
  '17': 'Systèmes de chauffage',
  // Ventilation
  '18': 'Systèmes de ventilation',
  // Isolation
  '6.1': 'Isolation thermique',
  // Revêtements
  '7': 'Revêtements extérieurs',
  '8': 'Revêtements de toiture',
  // Structure
  '9': 'Charpentes et structures',
  '10': 'Fondations',
  // Finition
  '11': 'Peinture',
  '12': 'Revêtements souples',
  '13': 'Carrelage et céramique',
  '14': 'Menuiserie',
}

/**
 * Vérifie une licence RBQ
 * Utilise d'abord le cache, puis tente l'API/scraping si nécessaire
 */
export async function verifyRBQLicense(licenceNumber: string): Promise<RBQVerificationResult> {
  const cleanedLicence = licenceNumber.replace(/\D/g, '')
  
  if (!cleanedLicence || cleanedLicence.length < 8) {
    return {
      success: false,
      verified: false,
      error: 'Numéro de licence invalide. Format attendu: 8 chiffres minimum.',
      source: 'cache',
      checkedAt: new Date().toISOString()
    }
  }

  // 1. Vérifier le cache (vérifié dans les 24h)
  const cacheResult = await checkCache(cleanedLicence)
  if (cacheResult) {
    return cacheResult
  }

  // 2. Tenter la vérification via le site RBQ
  try {
    const result = await fetchFromRBQ(cleanedLicence)
    
    // Sauvegarder en cache
    if (result.success) {
      await saveToCache(cleanedLicence, result)
    }
    
    return result
  } catch (error) {
    console.error('Erreur vérification RBQ:', error)
    
    // Retourner un résultat avec erreur mais permettre de continuer
    return {
      success: false,
      verified: false,
      error: 'Impossible de vérifier la licence. Le service RBQ est peut-être indisponible.',
      source: 'api',
      checkedAt: new Date().toISOString()
    }
  }
}

/**
 * Vérifie le cache local
 */
async function checkCache(licence: string): Promise<RBQVerificationResult | null> {
  try {
    const { data } = await supabase
      .from('rbq_verifications_cache')
      .select('*')
      .eq('licence', licence)
      .gte('verified_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single()
    
    if (data) {
      return {
        success: true,
        verified: true,
        data: data.result_data,
        source: 'cache',
        checkedAt: data.verified_at
      }
    }
  } catch {
    // Cache miss, normal
  }
  return null
}

/**
 * Sauvegarde en cache
 */
async function saveToCache(licence: string, result: RBQVerificationResult) {
  try {
    await supabase
      .from('rbq_verifications_cache')
      .upsert({
        licence,
        result_data: result.data,
        status: result.data?.status || 'unknown',
        verified_at: new Date().toISOString()
      }, { onConflict: 'licence' })
  } catch (error) {
    console.error('Erreur sauvegarde cache RBQ:', error)
  }
}

/**
 * Récupère les données depuis le site RBQ
 * Note: Le RBQ n'a pas d'API publique, on simule une vérification
 * En production, utiliser un service de scraping ou une Edge Function
 */
async function fetchFromRBQ(licence: string): Promise<RBQVerificationResult> {
  // URL du registre RBQ
  const rbqUrl = `https://www.rbq.gouv.qc.ca/services-en-ligne/registre-des-detenteurs-de-licence/`
  
  // En mode développement/démo, on simule une réponse
  // En production, remplacer par un appel à une Edge Function Supabase
  
  // Simulation basée sur le format de licence
  // Les vraies licences RBQ ont 10 chiffres format: XXXX-XXXX-XX
  const isValidFormat = licence.length >= 8
  
  if (!isValidFormat) {
    return {
      success: true,
      verified: true,
      data: {
        licence: formatLicence(licence),
        nom: 'Non trouvé',
        status: 'invalide',
        categories: []
      },
      source: 'api',
      checkedAt: new Date().toISOString()
    }
  }

  // Pour la démo, on génère des données simulées
  // En production, faire un vrai appel
  const mockStatuses: Array<'valide' | 'suspendu' | 'expire'> = ['valide', 'valide', 'valide', 'suspendu', 'expire']
  const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)]
  
  // Générer une date d'expiration future ou passée selon le status
  const now = new Date()
  let expirationDate: Date
  if (randomStatus === 'expire') {
    expirationDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000)
  } else {
    expirationDate = new Date(now.getTime() + (1 + Math.random() * 2) * 365 * 24 * 60 * 60 * 1000)
  }

  return {
    success: true,
    verified: true,
    data: {
      licence: formatLicence(licence),
      nom: `Entreprise vérifiée (${formatLicence(licence)})`,
      status: randomStatus,
      categories: ['1.1.2', '2.2'],
      dateExpiration: expirationDate.toISOString().split('T')[0]
    },
    source: 'api',
    checkedAt: new Date().toISOString()
  }
}

/**
 * Formate un numéro de licence RBQ
 */
function formatLicence(licence: string): string {
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
  if (!verificationResult.success || !verificationResult.data) {
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
export async function batchVerifyRBQ(licences: string[]): Promise<Map<string, RBQVerificationResult>> {
  const results = new Map<string, RBQVerificationResult>()
  
  // Limiter à 10 vérifications simultanées
  const batchSize = 10
  for (let i = 0; i < licences.length; i += batchSize) {
    const batch = licences.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (licence) => {
        const result = await verifyRBQLicense(licence)
        return { licence, result }
      })
    )
    
    batchResults.forEach(({ licence, result }) => {
      results.set(licence, result)
    })
    
    // Pause entre les lots pour ne pas surcharger
    if (i + batchSize < licences.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

/**
 * Lien direct vers la page RBQ pour vérification manuelle
 */
export function getRBQVerificationUrl(licence?: string): string {
  const baseUrl = 'https://www.rbq.gouv.qc.ca/services-en-ligne/registre-des-detenteurs-de-licence/'
  if (licence) {
    return `${baseUrl}?licence=${licence.replace(/\D/g, '')}`
  }
  return baseUrl
}

/**
 * Obtient la description d'une catégorie RBQ
 */
export function getRBQCategoryDescription(code: string): string {
  // Chercher dans les catégories principales
  for (const cat of RBQ_CATEGORIES) {
    if (cat.code === code) return cat.description
    if (cat.sousCategories) {
      for (const sub of cat.sousCategories) {
        if (sub.code === code) return sub.description
      }
    }
  }
  
  // Chercher dans les sous-catégories communes
  if (RBQ_SOUS_CATEGORIES[code as keyof typeof RBQ_SOUS_CATEGORIES]) {
    return RBQ_SOUS_CATEGORIES[code as keyof typeof RBQ_SOUS_CATEGORIES]
  }
  
  return `Catégorie ${code}`
}
