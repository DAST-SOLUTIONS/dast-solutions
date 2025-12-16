/**
 * DAST Solutions - Hook Vérification RBQ
 * Interface React pour le service RBQ
 */
import { useState, useCallback } from 'react'
import {
  verifyRBQLicense,
  updateEntrepreneurRBQStatus,
  batchVerifyRBQ,
  getRBQVerificationUrl,
  getRBQCategoryDescription,
  RBQVerificationResult,
  RBQ_CATEGORIES
} from '@/services/rbqService'

export interface UseRBQVerificationResult {
  // État
  verifying: boolean
  lastResult: RBQVerificationResult | null
  error: string | null
  
  // Actions
  verify: (licenceNumber: string) => Promise<RBQVerificationResult>
  verifyAndUpdate: (entrepreneurId: string, licenceNumber: string) => Promise<boolean>
  batchVerify: (licences: string[]) => Promise<Map<string, RBQVerificationResult>>
  
  // Helpers
  getVerificationUrl: (licence?: string) => string
  getCategoryDescription: (code: string) => string
  categories: typeof RBQ_CATEGORIES
  
  // Reset
  reset: () => void
}

export function useRBQVerification(): UseRBQVerificationResult {
  const [verifying, setVerifying] = useState(false)
  const [lastResult, setLastResult] = useState<RBQVerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const verify = useCallback(async (licenceNumber: string): Promise<RBQVerificationResult> => {
    setVerifying(true)
    setError(null)
    
    try {
      const result = await verifyRBQLicense(licenceNumber)
      setLastResult(result)
      
      if (!result.success) {
        setError(result.error || 'Erreur de vérification')
      }
      
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMsg)
      const errorResult: RBQVerificationResult = {
        success: false,
        verified: false,
        error: errorMsg,
        source: 'api',
        checkedAt: new Date().toISOString()
      }
      setLastResult(errorResult)
      return errorResult
    } finally {
      setVerifying(false)
    }
  }, [])

  const verifyAndUpdate = useCallback(async (
    entrepreneurId: string,
    licenceNumber: string
  ): Promise<boolean> => {
    const result = await verify(licenceNumber)
    
    if (result.success && result.data) {
      return await updateEntrepreneurRBQStatus(entrepreneurId, result)
    }
    
    return false
  }, [verify])

  const batchVerifyWrapper = useCallback(async (
    licences: string[]
  ): Promise<Map<string, RBQVerificationResult>> => {
    setVerifying(true)
    setError(null)
    
    try {
      return await batchVerifyRBQ(licences)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMsg)
      return new Map()
    } finally {
      setVerifying(false)
    }
  }, [])

  const reset = useCallback(() => {
    setLastResult(null)
    setError(null)
    setVerifying(false)
  }, [])

  return {
    verifying,
    lastResult,
    error,
    verify,
    verifyAndUpdate,
    batchVerify: batchVerifyWrapper,
    getVerificationUrl: getRBQVerificationUrl,
    getCategoryDescription: getRBQCategoryDescription,
    categories: RBQ_CATEGORIES,
    reset
  }
}

/**
 * Composant de badge de statut RBQ
 */
export function getRBQStatusBadge(status: string | undefined): {
  label: string
  className: string
  icon: 'check' | 'alert' | 'x' | 'question'
} {
  switch (status) {
    case 'valide':
      return {
        label: 'RBQ Valide',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: 'check'
      }
    case 'suspendu':
      return {
        label: 'RBQ Suspendu',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: 'alert'
      }
    case 'expire':
      return {
        label: 'RBQ Expiré',
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: 'x'
      }
    case 'invalide':
      return {
        label: 'RBQ Invalide',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: 'x'
      }
    default:
      return {
        label: 'Non vérifié',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: 'question'
      }
  }
}
