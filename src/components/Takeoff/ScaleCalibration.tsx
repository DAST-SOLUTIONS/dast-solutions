/**
 * DAST Solutions - ScaleCalibration
 * Calibration d'échelle simplifiée:
 * - Prédéfinie: échelles standards
 * - Manuelle: calibration 2 points sur le plan
 */
import { useState, useCallback } from 'react'
import { Ruler, X, Check, RotateCcw } from 'lucide-react'

interface ScaleCalibrationProps {
  isOpen: boolean
  onClose: () => void
  onCalibrate: (scaleX: number, scaleY: number, unit: 'metric' | 'imperial') => void
  currentScaleX?: number
  currentScaleY?: number
  currentUnit?: 'metric' | 'imperial'
}

// Échelles prédéfinies courantes
const PRESET_SCALES = {
  metric: [
    { label: '1:10', value: 0.1 },
    { label: '1:20', value: 0.05 },
    { label: '1:25', value: 0.04 },
    { label: '1:50', value: 0.02 },
    { label: '1:75', value: 0.0133 },
    { label: '1:100', value: 0.01 },
    { label: '1:200', value: 0.005 },
    { label: '1:250', value: 0.004 },
    { label: '1:500', value: 0.002 },
  ],
  imperial: [
    { label: '1" = 1\'', value: 1/12 },
    { label: '1/2" = 1\'', value: 1/24 },
    { label: '1/4" = 1\'', value: 1/48 },
    { label: '1/8" = 1\'', value: 1/96 },
    { label: '3/16" = 1\'', value: 3/192 },
    { label: '3/32" = 1\'', value: 3/384 },
    { label: '1" = 10\'', value: 1/120 },
    { label: '1" = 20\'', value: 1/240 },
    { label: '1" = 50\'', value: 1/600 },
  ]
}

export function ScaleCalibration({
  isOpen,
  onClose,
  onCalibrate,
  currentScaleX = 0.02,
  currentScaleY = 0.02,
  currentUnit = 'metric'
}: ScaleCalibrationProps) {
  const [unit, setUnit] = useState<'metric' | 'imperial'>(currentUnit)
  const [calibrationMode, setCalibrationMode] = useState<'preset' | 'manual'>('preset')
  
  // Calibration manuelle (2 points)
  const [calibrationAxis, setCalibrationAxis] = useState<'x' | 'y' | 'both'>('both')
  const [pixelDistance, setPixelDistance] = useState('')
  const [realDistance, setRealDistance] = useState('')
  const [realUnit, setRealUnit] = useState<'m' | 'cm' | 'mm' | 'ft' | 'in'>(unit === 'metric' ? 'm' : 'ft')
  const [linkAxes, setLinkAxes] = useState(true)

  // Convertir la distance en mètres
  const convertToMeters = useCallback((value: number, fromUnit: string): number => {
    switch (fromUnit) {
      case 'cm': return value / 100
      case 'mm': return value / 1000
      case 'ft': return value * 0.3048
      case 'in': return value * 0.0254
      default: return value // mètres
    }
  }, [])

  // Appliquer une échelle prédéfinie
  const applyPreset = useCallback((scale: number) => {
    onCalibrate(scale, scale, unit)
    onClose()
  }, [onCalibrate, onClose, unit])

  // Appliquer la calibration manuelle
  const applyManualScale = useCallback(() => {
    const pixels = parseFloat(pixelDistance)
    const real = parseFloat(realDistance)
    
    if (!pixels || !real || pixels <= 0 || real <= 0) {
      alert('Veuillez entrer des valeurs valides')
      return
    }

    const realMeters = convertToMeters(real, realUnit)
    const calculatedScale = realMeters / pixels

    if (linkAxes || calibrationAxis === 'both') {
      onCalibrate(calculatedScale, calculatedScale, unit)
    } else if (calibrationAxis === 'x') {
      onCalibrate(calculatedScale, currentScaleY, unit)
    } else {
      onCalibrate(currentScaleX, calculatedScale, unit)
    }
    
    onClose()
  }, [pixelDistance, realDistance, realUnit, calibrationAxis, linkAxes, currentScaleX, currentScaleY, unit, convertToMeters, onCalibrate, onClose])

  // Reset
  const resetCalibration = useCallback(() => {
    setPixelDistance('')
    setRealDistance('')
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Ruler size={24} />
            <div>
              <h2 className="text-xl font-bold">Calibration d'échelle</h2>
              <p className="text-sm text-amber-100">Définir l'échelle du plan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Système de mesure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Système de mesure
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setUnit('metric'); setRealUnit('m') }}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  unit === 'metric' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">Métrique</div>
                <div className="text-xs text-gray-500">m, cm, mm</div>
              </button>
              <button
                onClick={() => { setUnit('imperial'); setRealUnit('ft') }}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  unit === 'imperial' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">Impérial</div>
                <div className="text-xs text-gray-500">pi, po</div>
              </button>
            </div>
          </div>

          {/* Mode de calibration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Méthode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setCalibrationMode('preset')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  calibrationMode === 'preset' ? 'bg-amber-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                📐 Prédéfinie
              </button>
              <button
                onClick={() => setCalibrationMode('manual')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  calibrationMode === 'manual' ? 'bg-amber-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                📍 Manuelle (2 points)
              </button>
            </div>
          </div>

          {/* Échelles prédéfinies */}
          {calibrationMode === 'preset' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Échelles {unit === 'metric' ? 'métriques' : 'impériales'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_SCALES[unit].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset.value)}
                    className="px-3 py-2 bg-gray-50 hover:bg-amber-50 hover:border-amber-500 border-2 border-gray-200 rounded-lg text-sm font-mono transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calibration manuelle (2 points) */}
          {calibrationMode === 'manual' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong className="block mb-2">📏 Instructions:</strong>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Mesurez une distance connue sur le plan (ex: une cote)</li>
                  <li>Comptez les pixels entre les 2 points sur l'écran</li>
                  <li>Entrez la distance réelle correspondante</li>
                </ol>
                <div className="mt-2 text-xs text-blue-600">
                  💡 Astuce: Utilisez une règle d'architecte ou une dimension cotée sur le plan
                </div>
              </div>

              {/* Axe à calibrer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Axe à calibrer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'both', label: 'Les deux' },
                    { id: 'x', label: 'Axe X (horiz.)' },
                    { id: 'y', label: 'Axe Y (vert.)' }
                  ].map((axis) => (
                    <button
                      key={axis.id}
                      onClick={() => setCalibrationAxis(axis.id as any)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm transition ${
                        calibrationAxis === axis.id
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {axis.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance en pixels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance mesurée sur l'écran (pixels)
                </label>
                <input
                  type="number"
                  step="1"
                  value={pixelDistance}
                  onChange={(e) => setPixelDistance(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Ex: 500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mesurez avec l'outil de mesure ou une règle à l'écran
                </p>
              </div>

              {/* Distance réelle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance réelle correspondante
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={realDistance}
                    onChange={(e) => setRealDistance(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Ex: 10.5"
                  />
                  <select
                    value={realUnit}
                    onChange={(e) => setRealUnit(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {unit === 'metric' ? (
                      <>
                        <option value="m">m</option>
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                      </>
                    ) : (
                      <>
                        <option value="ft">pi (ft)</option>
                        <option value="in">po (in)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Aperçu du calcul */}
              {pixelDistance && realDistance && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <div className="font-medium text-green-800">Échelle calculée:</div>
                  <div className="text-green-700 font-mono">
                    {(() => {
                      const pixels = parseFloat(pixelDistance)
                      const real = parseFloat(realDistance)
                      if (pixels && real) {
                        const realMeters = convertToMeters(real, realUnit)
                        const scale = realMeters / pixels
                        const ratio = Math.round(1 / scale)
                        return `1:${ratio} (${scale.toFixed(6)} ${unit === 'metric' ? 'm' : 'ft'}/px)`
                      }
                      return '-'
                    })()}
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={resetCalibration}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Réinitialiser
                </button>
                <button
                  onClick={applyManualScale}
                  disabled={!pixelDistance || !realDistance}
                  className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  <Check size={18} />
                  Appliquer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500 border-t flex justify-between">
          <span>Échelle actuelle: 1:{Math.round(1/currentScaleX)}</span>
          <span>X={currentScaleX.toFixed(4)}, Y={currentScaleY.toFixed(4)}</span>
        </div>
      </div>
    </div>
  )
}

export default ScaleCalibration
