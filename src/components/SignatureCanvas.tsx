/**
 * DAST Solutions - Signature Canvas
 * Composant de capture de signature avec sauvegarde optionnelle en base de données
 */
import { useRef, useState, useEffect } from 'react'
import { Eraser, Check, Pen, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Props de base pour le canvas simple
export interface SignatureCanvasProps {
  onSave: ((signature: string) => void) | ((signatureData: string, signatureId: string) => void)
  onCancel?: () => void
  width?: number
  height?: number
  className?: string
  // Props optionnelles pour sauvegarde en DB
  documentType?: string
  documentId?: string
  signerName?: string
  signerRole?: string
}

// Composant SignatureDisplay pour afficher une signature existante
export function SignatureDisplay({ 
  signature, 
  className = '',
  showLabel = true 
}: { 
  signature: string
  className?: string
  showLabel?: boolean 
}) {
  if (!signature) {
    return (
      <div className={`flex items-center justify-center p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg ${className}`}>
        <div className="text-center text-gray-400">
          <Pen size={24} className="mx-auto mb-2" />
          <span className="text-sm">Aucune signature</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {showLabel && (
        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium">
          Signature
        </div>
      )}
      <div className="p-2">
        <img 
          src={signature} 
          alt="Signature" 
          className="max-w-full h-auto"
          style={{ maxHeight: '100px' }}
        />
      </div>
    </div>
  )
}

// Composant principal SignatureCanvas
export function SignatureCanvas({ 
  onSave, 
  onCancel,
  width = 400, 
  height = 150, 
  className = '',
  documentType,
  documentId,
  signerName,
  signerRole
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoords(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasSignature(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoords(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const save = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const dataUrl = canvas.toDataURL('image/png')
    
    // Si les props de document sont fournies, sauvegarder en DB
    if (documentType && documentId) {
      setSaving(true)
      try {
        // Créer l'enregistrement de signature dans Supabase
        const { data: sigData, error } = await supabase
          .from('signatures')
          .insert({
            document_type: documentType,
            document_id: documentId,
            signature_data: dataUrl,
            signer_name: signerName || '',
            signer_role: signerRole || '',
            signed_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) {
          console.error('Erreur sauvegarde signature:', error)
          // Fallback: appeler onSave avec juste les données
          if (onSave.length === 1) {
            (onSave as (signature: string) => void)(dataUrl)
          } else {
            (onSave as (signatureData: string, signatureId: string) => void)(dataUrl, '')
          }
        } else {
          // Appeler onSave avec les données et l'ID
          if (onSave.length === 1) {
            (onSave as (signature: string) => void)(dataUrl)
          } else {
            (onSave as (signatureData: string, signatureId: string) => void)(dataUrl, sigData.id)
          }
        }
      } catch (err) {
        console.error('Erreur:', err)
        // Fallback
        if (onSave.length === 1) {
          (onSave as (signature: string) => void)(dataUrl)
        }
      } finally {
        setSaving(false)
      }
    } else {
      // Pas de sauvegarde en DB, juste retourner les données
      if (onSave.length === 1) {
        (onSave as (signature: string) => void)(dataUrl)
      } else {
        (onSave as (signatureData: string, signatureId: string) => void)(dataUrl, '')
      }
    }
  }

  // Rendu modal si onCancel est fourni
  if (onCancel) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Signature</h3>
            <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {signerName && (
            <p className="text-sm text-gray-600 mb-3">
              Signataire: <span className="font-medium">{signerName}</span>
              {signerRole && <span className="text-gray-400"> ({signerRole})</span>}
            </p>
          )}
          
          <div className="border rounded-lg overflow-hidden bg-white mb-4">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair touch-none w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={clear}
              className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center justify-center gap-1"
            >
              <Eraser size={16} />
              Effacer
            </button>
            <button
              onClick={save}
              disabled={!hasSignature || saving}
              className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? 'Sauvegarde...' : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Rendu inline simple
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair touch-none"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={clear}
          className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center justify-center gap-1"
        >
          <Eraser size={16} />
          Effacer
        </button>
        <button
          onClick={save}
          disabled={!hasSignature || saving}
          className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? 'Sauvegarde...' : 'Confirmer'}
        </button>
      </div>
    </div>
  )
}

// Export default pour compatibilité
export default SignatureCanvas