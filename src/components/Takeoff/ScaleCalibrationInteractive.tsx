/**
 * DAST Solutions - ScaleCalibrationInteractive
 * Calibration d'échelle INTERACTIVE style Bluebeam:
 * - Cliquer 2 points directement sur le plan
 * - Entrer la distance réelle
 * - Calcul automatique de l'échelle
 * - Support métrique et impérial
 */
import { useState, useCallback, useEffect } from 'react'
import { Ruler, X, Check, RotateCcw, Target, ArrowRight, Info } from 'lucide-react'

interface Point {
  x: number
  y: number
}

interface ScaleCalibrationInteractiveProps {
  isActive: boolean
  onCancel: () => void
  onComplete: (scaleX: number, scaleY: number, unit: 'metric' | 'imperial') => void
  currentScaleX?: number
  currentScaleY?: number
  currentUnit?: 'metric' | 'imperial'
}

export function ScaleCalibrationInteractive({
  isActive,
  onCancel,
  onComplete,
  currentScaleX = 0.02,
  currentScaleY = 0.02,
  currentUnit = 'metric'
}: ScaleCalibrationInteractiveProps) {
  // Points cliqués sur le plan
  const [point1, setPoint1] = useState<Point | null>(null)
  const [point2, setPoint2] = useState<Point | null>(null)
  
  // Distance réelle
  const [realDistance, setRealDistance] = useState('')
  const [unit, setUnit] = useState<'metric' | 'imperial'>(currentUnit)
  const [distanceUnit, setDistanceUnit] = useState<'m' | 'cm' | 'mm' | 'ft' | 'in'>(
    currentUnit === 'metric' ? 'm' : 'ft'
  )
  
  // État
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Reset quand on active
  useEffect(() => {
    if (isActive) {
      setPoint1(null)
      setPoint2(null)
      setRealDistance('')
      setStep(1)
    }
  }, [isActive])

  // Gérer le clic sur le canvas (appelé depuis le parent)
  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (!isActive) return false

    if (step === 1) {
      setPoint1({ x, y })
      setStep(2)
      return true
    } else if (step === 2) {
      setPoint2({ x, y })
      setStep(3)
      return true
    }
    return false
  }, [isActive, step])

  // Calculer la distance en pixels entre les 2 points
  const pixelDistance = point1 && point2 
    ? Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
    : 0

  // Convertir en mètres
  const convertToMeters = (value: number, fromUnit: string): number => {
    switch (fromUnit) {
      case 'cm': return value / 100
      case 'mm': return value / 1000
      case 'ft': return value * 0.3048
      case 'in': return value * 0.0254
      default: return value
    }
  }

  // Calculer l'échelle
  const calculatedScale = pixelDistance > 0 && parseFloat(realDistance) > 0
    ? convertToMeters(parseFloat(realDistance), distanceUnit) / pixelDistance
    : null

  // Appliquer l'échelle
  const applyScale = useCallback(() => {
    if (!calculatedScale) return
    onComplete(calculatedScale, calculatedScale, unit)
  }, [calculatedScale, unit, onComplete])

  // Reset
  const reset = useCallback(() => {
    setPoint1(null)
    setPoint2(null)
    setRealDistance('')
    setStep(1)
  }, [])

  // Exposer handleCanvasClick via window pour le parent
  useEffect(() => {
    if (isActive) {
      (window as any).__scaleCalibrationClick = handleCanvasClick
    }
    return () => {
      delete (window as any).__scaleCalibrationClick
    }
  }, [isActive, handleCanvasClick])

  if (!isActive) return null

  return (
    <>
      {/* Overlay d'instructions flottant */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-2xl p-4 min-w-[400px]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Ruler size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Calibration d'échelle</h3>
            
            {/* Étapes */}
            <div className="mt-3 space-y-2">
              {/* Étape 1 */}
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white' : 'text-white/50'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === 1 ? 'bg-white text-amber-600 animate-pulse' : 
                  step > 1 ? 'bg-green-400 text-white' : 'bg-white/30'
                }`}>
                  {step > 1 ? '✓' : '1'}
                </div>
                <span className={step === 1 ? 'font-semibold' : ''}>
                  {step === 1 ? '👆 Cliquez sur le PREMIER point' : 'Premier point défini'}
                </span>
                {point1 && <span className="text-xs opacity-75">({Math.round(point1.x)}, {Math.round(point1.y)})</span>}
              </div>

              {/* Étape 2 */}
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-white/50'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === 2 ? 'bg-white text-amber-600 animate-pulse' : 
                  step > 2 ? 'bg-green-400 text-white' : 'bg-white/30'
                }`}>
                  {step > 2 ? '✓' : '2'}
                </div>
                <span className={step === 2 ? 'font-semibold' : ''}>
                  {step === 2 ? '👆 Cliquez sur le SECOND point' : step > 2 ? 'Second point défini' : 'Cliquer le second point'}
                </span>
                {point2 && <span className="text-xs opacity-75">({Math.round(point2.x)}, {Math.round(point2.y)})</span>}
              </div>

              {/* Étape 3 - Saisie distance */}
              {step === 3 && (
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <div className="text-sm mb-2">
                    📏 Distance mesurée: <strong>{pixelDistance.toFixed(1)} pixels</strong>
                  </div>
                  
                  {/* Système de mesure */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => { setUnit('metric'); setDistanceUnit('m') }}
                      className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition ${
                        unit === 'metric' ? 'bg-white text-amber-600' : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      Métrique
                    </button>
                    <button
                      onClick={() => { setUnit('imperial'); setDistanceUnit('ft') }}
                      className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition ${
                        unit === 'imperial' ? 'bg-white text-amber-600' : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      Impérial
                    </button>
                  </div>

                  {/* Distance réelle */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.01"
                        value={realDistance}
                        onChange={(e) => setRealDistance(e.target.value)}
                        placeholder="Distance réelle..."
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-amber-300"
                      />
                    </div>
                    <select
                      value={distanceUnit}
                      onChange={(e) => setDistanceUnit(e.target.value as any)}
                      className="px-3 py-2 rounded-lg text-gray-800 bg-white"
                    >
                      {unit === 'metric' ? (
                        <>
                          <option value="m">m</option>
                          <option value="cm">cm</option>
                          <option value="mm">mm</option>
                        </>
                      ) : (
                        <>
                          <option value="ft">pi</option>
                          <option value="in">po</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Résultat calculé */}
                  {calculatedScale && (
                    <div className="mt-3 p-2 bg-green-500/30 rounded-lg text-sm">
                      <strong>Échelle calculée:</strong> 1:{Math.round(1 / calculatedScale)}
                      <span className="text-xs ml-2 opacity-75">
                        ({calculatedScale.toFixed(6)} m/px)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                <X size={16} />
                Annuler
              </button>
              
              {step === 3 && (
                <>
                  <button
                    onClick={reset}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={applyScale}
                    disabled={!calculatedScale}
                    className="flex-1 px-4 py-2 bg-white text-amber-600 hover:bg-amber-50 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Appliquer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Points visuels sur le canvas - rendu par le parent via les données exportées */}
    </>
  )
}

// Hook pour utiliser la calibration depuis le parent
export function useScaleCalibration() {
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationPoints, setCalibrationPoints] = useState<{ point1: Point | null; point2: Point | null }>({
    point1: null,
    point2: null
  })

  const startCalibration = useCallback(() => {
    setIsCalibrating(true)
    setCalibrationPoints({ point1: null, point2: null })
  }, [])

  const cancelCalibration = useCallback(() => {
    setIsCalibrating(false)
    setCalibrationPoints({ point1: null, point2: null })
  }, [])

  const handleCalibrationClick = useCallback((x: number, y: number): boolean => {
    if (!isCalibrating) return false

    if (!calibrationPoints.point1) {
      setCalibrationPoints(prev => ({ ...prev, point1: { x, y } }))
      return true
    } else if (!calibrationPoints.point2) {
      setCalibrationPoints(prev => ({ ...prev, point2: { x, y } }))
      return true
    }
    return false
  }, [isCalibrating, calibrationPoints])

  const completeCalibration = useCallback((onComplete: (scale: number) => void) => {
    if (!calibrationPoints.point1 || !calibrationPoints.point2) return

    const pixelDistance = Math.sqrt(
      Math.pow(calibrationPoints.point2.x - calibrationPoints.point1.x, 2) +
      Math.pow(calibrationPoints.point2.y - calibrationPoints.point1.y, 2)
    )

    // La distance réelle sera demandée dans un modal
    return pixelDistance
  }, [calibrationPoints])

  return {
    isCalibrating,
    calibrationPoints,
    startCalibration,
    cancelCalibration,
    handleCalibrationClick,
    completeCalibration,
    setCalibrationPoints
  }
}

export default ScaleCalibrationInteractive
