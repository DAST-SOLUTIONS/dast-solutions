/**
 * DAST Solutions - Signature Canvas
 * Composants pour capture et affichage de signatures
 */
import { useRef, useState, useEffect } from 'react'
import { Eraser, Check, Pen, Image, X, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ============ TYPES ============
export interface SignatureCanvasProps {
  onSave: (signatureData: string, signatureId?: string) => void
  onCancel?: () => void
  documentType?: string
  documentId?: string
  signerName?: string
  signerRole?: string
  width?: number
  height?: number
  className?: string
}

export interface SignatureDisplayProps {
  signature?: string | null
  className?: string
  placeholder?: string
}

// ============ SIGNATURE CANVAS (modal complet) ============
export function SignatureCanvas({ 
  onSave, 
  onCancel,
  documentType,
  documentId,
  signerName,
  signerRole,
  width = 500, 
  height = 200, 
  className = '' 
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    initCanvas()
  }, [])

  const initCanvas = () => {
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
  }

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { 
        x: (e.touches[0].clientX - rect.left) * scaleX, 
        y: (e.touches[0].clientY - rect.top) * scaleY 
      }
    }
    return { 
      x: (e.clientX - rect.left) * scaleX, 
      y: (e.clientY - rect.top) * scaleY 
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
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
    e.preventDefault()
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
    initCanvas()
    setHasSignature(false)
  }

  const save = async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return
    
    setSaving(true)
    try {
      const dataUrl = canvas.toDataURL('image/png')
      
      // Si on a un documentType et documentId, on sauvegarde dans Supabase
      if (documentType && documentId) {
        // Upload l'image dans le storage
        const fileName = `signatures/${documentType}/${documentId}_${Date.now()}.png`
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
        const blob = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, blob, { contentType: 'image/png', upsert: true })
        
        if (uploadError) {
          console.error('Upload error:', uploadError)
        }
        
        // Créer l'enregistrement de signature
        const { data: sigData, error: sigError } = await supabase
          .from('signatures')
          .insert({
            document_type: documentType,
            document_id: documentId,
            signer_name: signerName || 'Non spécifié',
            signer_role: signerRole || 'unknown',
            signature_data: dataUrl,
            signed_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (sigError) {
          console.error('Signature save error:', sigError)
          onSave(dataUrl, undefined)
        } else {
          onSave(dataUrl, sigData?.id)
        }
      } else {
        onSave(dataUrl)
      }
    } catch (err) {
      console.error('Save error:', err)
      onSave(canvas.toDataURL('image/png'))
    } finally {
      setSaving(false)
    }
  }

  // Mode modal si onCancel est fourni
  if (onCancel) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`bg-white rounded-xl max-w-xl w-full shadow-xl ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Signature électronique</h3>
              {signerName && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <User size={14} />
                  <span>{signerName}</span>
                  {signerRole && <span className="text-gray-400">• {signerRole}</span>}
                </div>
              )}
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Canvas */}
          <div className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <Pen size={14} />
              <span>Utilisez votre souris ou écran tactile pour signer</span>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:border-teal-400 transition-colors">
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
                className="cursor-crosshair touch-none w-full bg-white"
                style={{ height: `${height}px` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 border-t bg-gray-50">
            <button
              type="button"
              onClick={clear}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white flex items-center justify-center gap-2"
            >
              <Eraser size={16} />
              Effacer
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white flex items-center justify-center gap-2"
            >
              <X size={16} />
              Annuler
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!hasSignature || saving}
              className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check size={16} />
              )}
              {saving ? 'Enregistrement...' : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Mode inline (sans modal)
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Pen size={16} />
        <span>Dessinez votre signature ci-dessous</span>
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white hover:border-teal-400 transition-colors">
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
          style={{ height: `${height}px` }}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
        >
          <Eraser size={16} />
          Effacer
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!hasSignature || saving}
          className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check size={16} />
          )}
          {saving ? 'Enregistrement...' : 'Confirmer'}
        </button>
      </div>
    </div>
  )
}

// ============ SIGNATURE DISPLAY (pour afficher) ============
export function SignatureDisplay({ signature, className = '', placeholder = 'Aucune signature' }: SignatureDisplayProps) {
  if (!signature) {
    return (
      <div className={`flex items-center justify-center p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg ${className}`}>
        <div className="text-center text-gray-400">
          <Image size={24} className="mx-auto mb-1" />
          <span className="text-sm">{placeholder}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      <img 
        src={signature} 
        alt="Signature" 
        className="w-full h-auto max-h-32 object-contain"
      />
    </div>
  )
}

// ============ DEFAULT EXPORT (pour compatibilité) ============
export default SignatureCanvas
