/**
 * DAST Solutions - Hook Export PDF Soumissions
 */
import { useState, useCallback } from 'react'
import { 
  generateSoumissionPDF, 
  downloadPDF, 
  openPDFInNewTab,
  soumissionToPDFData,
  SoumissionPDFData 
} from '@/services/pdfService'
import { supabase } from '@/lib/supabase'

// Configuration entreprise par défaut (à personnaliser dans Settings)
const DEFAULT_ENTREPRISE: SoumissionPDFData['entreprise'] = {
  nom: 'DAST Solutions',
  adresse: '123 Rue Principale',
  ville: 'Montréal',
  province: 'QC',
  codePostal: 'H2X 1Y6',
  telephone: '(514) 555-1234',
  email: 'info@dastsolutions.ca',
  site: 'www.dastsolutions.ca',
  rbqLicence: '1234-5678-90',
  neq: '1234567890'
}

export function useSoumissionPDF() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Charge les paramètres entreprise depuis le profil utilisateur
   */
  const loadEntrepriseSettings = useCallback(async (): Promise<SoumissionPDFData['entreprise']> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return DEFAULT_ENTREPRISE

      const { data: settings } = await supabase
        .from('user_settings')
        .select('entreprise_settings')
        .eq('user_id', user.id)
        .single()

      if (settings?.entreprise_settings) {
        return { ...DEFAULT_ENTREPRISE, ...settings.entreprise_settings }
      }
    } catch {
      console.log('Using default entreprise settings')
    }
    return DEFAULT_ENTREPRISE
  }, [])

  /**
   * Génère et télécharge le PDF d'une soumission
   */
  const downloadSoumissionPDF = useCallback(async (soumissionId: string) => {
    setGenerating(true)
    setError(null)

    try {
      // Charger la soumission avec ses items
      const { data: soumission, error: fetchError } = await supabase
        .from('soumissions')
        .select('*')
        .eq('id', soumissionId)
        .single()

      if (fetchError) throw fetchError

      const { data: items } = await supabase
        .from('soumission_items')
        .select('*')
        .eq('soumission_id', soumissionId)
        .order('sort_order')

      soumission.items = items || []

      // Charger les paramètres entreprise
      const entreprise = await loadEntrepriseSettings()

      // Convertir en données PDF
      const pdfData = soumissionToPDFData(soumission, entreprise)

      // Générer le PDF
      const blob = await generateSoumissionPDF(pdfData)

      // Télécharger
      const filename = `Soumission_${soumission.soumission_number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      downloadPDF(blob, filename)

      return true
    } catch (err) {
      console.error('Erreur génération PDF:', err)
      setError(err instanceof Error ? err.message : 'Erreur de génération')
      return false
    } finally {
      setGenerating(false)
    }
  }, [loadEntrepriseSettings])

  /**
   * Génère et ouvre le PDF dans un nouvel onglet (aperçu)
   */
  const previewSoumissionPDF = useCallback(async (soumissionId: string) => {
    setGenerating(true)
    setError(null)

    try {
      const { data: soumission, error: fetchError } = await supabase
        .from('soumissions')
        .select('*')
        .eq('id', soumissionId)
        .single()

      if (fetchError) throw fetchError

      const { data: items } = await supabase
        .from('soumission_items')
        .select('*')
        .eq('soumission_id', soumissionId)
        .order('sort_order')

      soumission.items = items || []

      const entreprise = await loadEntrepriseSettings()
      const pdfData = soumissionToPDFData(soumission, entreprise)
      const blob = await generateSoumissionPDF(pdfData)

      openPDFInNewTab(blob)
      return true
    } catch (err) {
      console.error('Erreur aperçu PDF:', err)
      setError(err instanceof Error ? err.message : 'Erreur de génération')
      return false
    } finally {
      setGenerating(false)
    }
  }, [loadEntrepriseSettings])

  /**
   * Génère un PDF personnalisé avec des données fournies
   */
  const generateCustomPDF = useCallback(async (data: SoumissionPDFData) => {
    setGenerating(true)
    setError(null)

    try {
      const blob = await generateSoumissionPDF(data)
      return blob
    } catch (err) {
      console.error('Erreur génération PDF:', err)
      setError(err instanceof Error ? err.message : 'Erreur de génération')
      return null
    } finally {
      setGenerating(false)
    }
  }, [])

  return {
    generating,
    error,
    downloadSoumissionPDF,
    previewSoumissionPDF,
    generateCustomPDF,
    downloadPDF,
    openPDFInNewTab
  }
}
