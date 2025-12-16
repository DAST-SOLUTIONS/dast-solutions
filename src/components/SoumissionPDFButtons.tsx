/**
 * DAST Solutions - Boutons Export PDF pour Soumissions
 * À intégrer dans la page Soumissions existante
 */
import { useState } from 'react'
import { Download, Eye, Loader2, FileText } from 'lucide-react'
import { useSoumissionPDF } from '@/hooks/useSoumissionPDF'

interface PDFButtonsProps {
  soumissionId: string
  soumissionNumber?: string
  variant?: 'icon' | 'full'
  className?: string
}

export function SoumissionPDFButtons({ 
  soumissionId, 
  soumissionNumber,
  variant = 'full',
  className = ''
}: PDFButtonsProps) {
  const { downloadSoumissionPDF, previewSoumissionPDF, generating } = useSoumissionPDF()

  const handleDownload = async () => {
    await downloadSoumissionPDF(soumissionId)
  }

  const handlePreview = async () => {
    await previewSoumissionPDF(soumissionId)
  }

  if (variant === 'icon') {
    return (
      <div className={`flex gap-1 ${className}`}>
        <button
          onClick={handlePreview}
          disabled={generating}
          className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50"
          title="Aperçu PDF"
        >
          {generating ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
        </button>
        <button
          onClick={handleDownload}
          disabled={generating}
          className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50"
          title="Télécharger PDF"
        >
          <Download size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={handlePreview}
        disabled={generating}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
      >
        {generating ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
        Aperçu
      </button>
      <button
        onClick={handleDownload}
        disabled={generating}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        <Download size={16} />
        PDF
      </button>
    </div>
  )
}

/**
 * Composant carte de téléchargement rapide
 */
export function QuickPDFDownload({ 
  soumissions 
}: { 
  soumissions: Array<{ id: string; soumission_number: string; client_name?: string; total?: number }> 
}) {
  const { downloadSoumissionPDF, generating } = useSoumissionPDF()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (id: string) => {
    setDownloadingId(id)
    await downloadSoumissionPDF(id)
    setDownloadingId(null)
  }

  if (soumissions.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <FileText size={18} className="text-teal-600" />
        Export PDF rapide
      </h4>
      <div className="space-y-2">
        {soumissions.slice(0, 5).map(s => (
          <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{s.soumission_number}</p>
              <p className="text-xs text-gray-500 truncate">{s.client_name || 'Sans client'}</p>
            </div>
            <button
              onClick={() => handleDownload(s.id)}
              disabled={generating}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
            >
              {downloadingId === s.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SoumissionPDFButtons
