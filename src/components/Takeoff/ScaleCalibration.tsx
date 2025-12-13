/**
 * DAST Solutions - ScaleCalibration
 * Calibration manuelle de l'échelle sur 2 axes (X et Y)
 * Support impérial et métrique
 */
import { useState, useCallback } from 'react'
import { Ruler, X, Check, RotateCcw, Move } from 'lucide-react'

interface CalibrationPoint {
  x: number
  y: number
}

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
  const [calibrationMode, setCalibrationMode] = useState<'preset' | 'manual' | '2point'>('preset')
  
  // Échelle manuelle
  const [manualScaleX, setManualScaleX] = useState(currentScaleX.toString())
  const [manualScaleY, setManualScaleY] = useState(currentScaleY.toString())
  const [linkAxes, setLinkAxes] = useState(true)
  
  // Calibration 2 points
  const [calibrationAxis, setCalibrationAxis] = useState<'x' | 'y'>('x')
  const [point1, setPoint1] = useState<CalibrationPoint | null>(null)
  const [point2, setPoint2] = useState<CalibrationPoint | null>(null)
  const [knownDistance, setKnownDistance] = useState('')
  const [knownUnit, setKnownUnit] = useState<'m' | 'cm' | 'mm' | 'ft' | 'in'>(unit === 'metric' ? 'm' : 'ft')

  // Calculer la distance en pixels entre 2 points
  const calculatePixelDistance = useCallback(() => {
    if (!point1 || !point2) return 0
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [point1, point2])

  // Convertir la distance connue en mètres
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

  // Appliquer l'échelle manuelle
  const applyManualScale = useCallback(() => {
    const scaleX = parseFloat(manualScaleX) || 0.02
    const scaleY = linkAxes ? scaleX : (parseFloat(manualScaleY) || 0.02)
    onCalibrate(scaleX, scaleY, unit)
    onClose()
  }, [manualScaleX, manualScaleY, linkAxes, unit, onCalibrate, onClose])

  // Calculer et appliquer l'échelle depuis 2 points
  const apply2PointScale = useCallback(() => {
    if (!point1 || !point2 || !knownDistance) {
      alert('Veuillez définir 2 points et entrer la distance connue')
      return
    }

    const pixelDist = calculatePixelDistance()
    const realDistMeters = convertToMeters(parseFloat(knownDistance), knownUnit)
    
    // Échelle = distance réelle / distance pixels
    const calculatedScale = realDistMeters / pixelDist

    if (calibrationAxis === 'x') {
      const scaleY = linkAxes ? calculatedScale : currentScaleY
      onCalibrate(calculatedScale, scaleY, unit)
    } else {
      const scaleX = linkAxes ? calculatedScale : currentScaleX
      onCalibrate(scaleX, calculatedScale, unit)
    }
    
    onClose()
  }, [point1, point2, knownDistance, knownUnit, calibrationAxis, linkAxes, currentScaleX, currentScaleY, unit, calculatePixelDistance, convertToMeters, onCalibrate, onClose])

  // Reset calibration
  const resetCalibration = useCallback(() => {
    setPoint1(null)
    setPoint2(null)
    setKnownDistance('')
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Ruler size={24} />
            <div>
              <h2 className="text-xl font-bold">Calibration d'échelle</h2>
              <p className="text-sm text-teal-100">Définir l'échelle du plan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Sélection du système de mesure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Système de mesure
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setUnit('metric')
                  setKnownUnit('m')
                }}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  unit === 'metric' 
                    ? 'border-teal-500 bg-teal-50 text-teal-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">Métrique</div>
                <div className="text-xs text-gray-500">m, cm, mm</div>
              </button>
              <button
                onClick={() => {
                  setUnit('imperial')
                  setKnownUnit('ft')
                }}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  unit === 'imperial' 
                    ? 'border-teal-500 bg-teal-50 text-teal-700' 
                    : 'border-gray-200 hover:border-gray-300'
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
              Méthode de calibration
            </label>
            <div className="flex gap-2">
              {[
                { id: 'preset', label: 'Prédéfinie', icon: '📐' },
                { id: 'manual', label: 'Manuelle', icon: '✏️' },
                { id: '2point', label: '2 Points', icon: '📍' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setCalibrationMode(mode.id as any)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    calibrationMode === mode.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {mode.icon} {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Échelles prédéfinies */}
          {calibrationMode === 'preset' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Échelles courantes ({unit === 'metric' ? 'métriques' : 'impériales'})
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_SCALES[unit].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset.value)}
                    className="px-3 py-2 bg-gray-50 hover:bg-teal-50 hover:border-teal-500 border-2 border-gray-200 rounded-lg text-sm font-mono transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Échelle manuelle */}
          {calibrationMode === 'manual' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="linkAxes"
                  checked={linkAxes}
                  onChange={(e) => setLinkAxes(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <label htmlFor="linkAxes" className="text-sm text-gray-600">
                  Lier les axes X et Y (même échelle)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Échelle X {unit === 'metric' ? '(m/px)' : '(ft/px)'}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={manualScaleX}
                    onChange={(e) => {
                      setManualScaleX(e.target.value)
                      if (linkAxes) setManualScaleY(e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="0.02"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Échelle Y {unit === 'metric' ? '(m/px)' : '(ft/px)'}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={manualScaleY}
                    onChange={(e) => setManualScaleY(e.target.value)}
                    disabled={linkAxes}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 ${
                      linkAxes ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="0.02"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <strong>Aide:</strong> Pour 1:50, entrez 0.02 (1m = 50px sur le plan)
              </div>

              <button
                onClick={applyManualScale}
                className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 font-medium"
              >
                <Check size={18} />
                Appliquer l'échelle
              </button>
            </div>
          )}

          {/* Calibration 2 points */}
          {calibrationMode === '2point' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>Instructions:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Cliquez sur le plan pour définir le point 1</li>
                  <li>Cliquez sur le plan pour définir le point 2</li>
                  <li>Entrez la distance réelle entre ces 2 points</li>
                </ol>
              </div>

              {/* Sélection de l'axe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Axe à calibrer
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCalibrationAxis('x')}
                    className={`px-4 py-2 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                      calibrationAxis === 'x'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Move size={16} className="rotate-0" />
                    Axe X (horizontal)
                  </button>
                  <button
                    onClick={() => setCalibrationAxis('y')}
                    className={`px-4 py-2 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                      calibrationAxis === 'y'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Move size={16} className="rotate-90" />
                    Axe Y (vertical)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="linkAxes2p"
                  checked={linkAxes}
                  onChange={(e) => setLinkAxes(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <label htmlFor="linkAxes2p" className="text-sm text-gray-600">
                  Appliquer la même échelle aux deux axes
                </label>
              </div>

              {/* Points sélectionnés */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border-2 ${point1 ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300'}`}>
                  <div className="text-sm font-medium text-gray-700">Point 1</div>
                  {point1 ? (
                    <div className="text-xs text-gray-500 font-mono">
                      X: {point1.x.toFixed(0)}, Y: {point1.y.toFixed(0)}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Non défini</div>
                  )}
                </div>
                <div className={`p-3 rounded-lg border-2 ${point2 ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300'}`}>
                  <div className="text-sm font-medium text-gray-700">Point 2</div>
                  {point2 ? (
                    <div className="text-xs text-gray-500 font-mono">
                      X: {point2.x.toFixed(0)}, Y: {point2.y.toFixed(0)}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Non défini</div>
                  )}
                </div>
              </div>

              {/* Distance pixels */}
              {point1 && point2 && (
                <div className="text-sm text-gray-600 text-center">
                  Distance sur le plan: <strong>{calculatePixelDistance().toFixed(1)} pixels</strong>
                </div>
              )}

              {/* Distance réelle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance réelle entre les 2 points
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={knownDistance}
                    onChange={(e) => setKnownDistance(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Ex: 10.5"
                  />
                  <select
                    value={knownUnit}
                    onChange={(e) => setKnownUnit(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
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

              <div className="flex gap-2">
                <button
                  onClick={resetCalibration}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Réinitialiser
                </button>
                <button
                  onClick={apply2PointScale}
                  disabled={!point1 || !point2 || !knownDistance}
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  <Check size={18} />
                  Calibrer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500 border-t">
          Échelle actuelle: X={currentScaleX.toFixed(4)}, Y={currentScaleY.toFixed(4)} ({currentUnit})
        </div>
      </div>
    </div>
  )
}

export default ScaleCalibration
