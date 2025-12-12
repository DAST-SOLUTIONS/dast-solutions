/**
 * DAST Solutions - PlanUploader
 * Upload de plans avec drag & drop
 */
import { useState, useCallback, useRef } from 'react'
import { Upload, FileUp, X, File, AlertCircle } from 'lucide-react'

interface PlanUploaderProps {
  onFileSelect: (file: File) => void
  onFileUpload?: (file: File) => Promise<void>
  acceptedTypes?: string[]
  maxSizeMB?: number
  isUploading?: boolean
}

export function PlanUploader({
  onFileSelect,
  onFileUpload,
  acceptedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'],
  maxSizeMB = 50,
  isUploading = false
}: PlanUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Type de fichier non supporté. Acceptés: PDF, PNG, JPG, TIFF`
    }
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      return `Fichier trop volumineux (${sizeMB.toFixed(1)}MB). Maximum: ${maxSizeMB}MB`
    }
    return null
  }

  const handleFile = useCallback((file: File) => {
    setError(null)
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setSelectedFile(file)
    onFileSelect(file)
  }, [onFileSelect, acceptedTypes, maxSizeMB])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleClear = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (selectedFile && onFileUpload) {
      try {
        await onFileUpload(selectedFile)
      } catch {
        setError('Erreur lors du téléversement')
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging 
            ? 'border-teal-500 bg-teal-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4" />
            <p className="text-gray-600">Téléversement en cours...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center">
            <File className="h-12 w-12 text-teal-600 mb-3" />
            <p className="font-medium text-gray-800">{selectedFile.name}</p>
            <p className="text-sm text-gray-500 mt-1">{formatFileSize(selectedFile.size)}</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={(e) => { e.stopPropagation(); handleClear() }}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition flex items-center gap-2"
              >
                <X size={16} /> Annuler
              </button>
              {onFileUpload && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleUpload() }}
                  className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <FileUp size={16} /> Téléverser
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-teal-100' : 'bg-gray-100'}`}>
              <Upload className={`h-8 w-8 ${isDragging ? 'text-teal-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-1">
              {isDragging ? 'Déposez le fichier ici' : 'Glissez-déposez un plan'}
            </p>
            <p className="text-sm text-gray-500 mb-3">ou cliquez pour sélectionner</p>
            <p className="text-xs text-gray-400">PDF, PNG, JPG, TIFF • Max {maxSizeMB}MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  )
}
