/**
 * DAST Solutions - Composant Signature Électronique
 * Canvas pour signature tactile/souris
 */
import { useRef, useState, useEffect } from 'react'
import { X, Check, RotateCcw, Pen } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SignatureCanvasProps {
  onSave: (signatureData: string, signatureId: string) => void
  onCancel: () => void
  documentType: 'rapport_terrain' | 'facture' | 'soumission' | 'contrat' | 'autre'
  documentId: string
  signerName?: string
  signerRole?: string
}

export function SignatureCanvas({
  onSave,
  onCancel,
  documentType,
  documentId,
  signerName: initialName = '',
  signerRole = 'client'
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signerName, setSignerName] = useState(initialName)
  const [signerEmail, setSignerEmail] = useState('')
  const [saving, setSaving] = useState(false)

  // Initialiser le canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Fond blanc
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Style du trait
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  // Obtenir les coordonnées relatives au canvas
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    }
  }

  // Début du dessin
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasSignature(true)
  }

  // Dessin en cours
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  // Fin du dessin
  const stopDrawing = () => {
    setIsDrawing(false)
  }

  // Effacer la signature
  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  // Sauvegarder la signature
  const saveSignature = async () => {
    if (!hasSignature || !signerName.trim()) {
      alert('Veuillez signer et entrer votre nom')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    setSaving(true)
    try {
      const signatureData = canvas.toDataURL('image/png')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Sauvegarder dans la BD
      const { data, error } = await supabase
        .from('signatures')
        .insert({
          user_id: user.id,
          document_type: documentType,
          document_id: documentId,
          signer_name: signerName.trim(),
          signer_email: signerEmail.trim() || null,
          signer_role: signerRole,
          signature_data: signatureData,
          ip_address: null, // Optionnel
          user_agent: navigator.userAgent
        })
        .select()
        .single()

      if (error) throw error

      onSave(signatureData, data.id)
    } catch (err) {
      console.error('Erreur sauvegarde signature:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Pen size={20} /> Signature électronique
          </h3>
          <button onClick={onCancel} className="text-white hover:bg-white/20 rounded p-1">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Zone de signature */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signez ci-dessous:
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                width={450}
                height={150}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={clearSignature}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <RotateCcw size={14} /> Effacer
              </button>
            </div>
          </div>

          {/* Nom du signataire */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Entrez votre nom"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>

          {/* Email (optionnel) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Courriel (optionnel)
            </label>
            <input
              type="email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Avertissement légal */}
          <p className="text-xs text-gray-500 mb-4">
            En signant, vous confirmez avoir lu et accepté le contenu du document.
            Cette signature électronique a la même valeur légale qu'une signature manuscrite.
          </p>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            onClick={saveSignature}
            disabled={saving || !hasSignature || !signerName.trim()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Check size={18} />
            )}
            Signer
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Composant pour afficher une signature existante
 */
export function SignatureDisplay({ 
  signatureData, 
  signerName, 
  signedAt 
}: { 
  signatureData: string
  signerName: string
  signedAt: string 
}) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <p className="text-sm font-medium text-gray-700 mb-2">Signé par:</p>
      <img 
        src={signatureData} 
        alt="Signature" 
        className="max-w-[200px] h-auto border rounded bg-white mb-2"
      />
      <p className="text-sm text-gray-900 font-medium">{signerName}</p>
      <p className="text-xs text-gray-500">
        {new Date(signedAt).toLocaleString('fr-CA')}
      </p>
    </div>
  )
}

export default SignatureCanvas
