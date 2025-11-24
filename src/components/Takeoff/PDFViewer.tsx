import { useState } from 'react'

interface PDFViewerProps {
  fileUrl: string
  onMeasurement: (measurement: any) => void
  activeTool: 'select' | 'linear' | 'area' | 'count'
}

export function PDFViewer({ fileUrl }: PDFViewerProps) {
  const [scale, setScale] = useState<number>(1.0)

  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-4 bg-gray-100 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="btn btn-secondary text-sm px-3">−</button>
          <span className="text-sm font-medium">{(scale * 100).toFixed(0)}%</span>
          <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="btn btn-secondary text-sm px-3">+</button>
        </div>
        <div className="text-sm text-gray-600">🚧 Outils de mesure en développement</div>
      </div>
      <div className="border-2 border-gray-300 rounded-lg bg-gray-50 p-4 overflow-auto">
        <img src={fileUrl} alt="Plan" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }} className="max-w-none" />
      </div>
    </div>
  )
}
