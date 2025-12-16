/**
 * DAST Solutions - Takeoff Components
 * Export de tous les composants du module Takeoff
 * Version complète avec Options C, D, E, F, G
 */

// Composants de base
export { PlanUploader } from './PlanUploader'
export { PDFViewer } from './PDFViewer'
export { MeasureToolbar } from './MeasureToolbar'
export { MeasurementList } from './MeasurementList'
export { MeasurementEditor } from './MeasurementEditor'
export { OCRExtractor } from './OCRExtractor'
export { TakeoffViewer } from './TakeoffViewer'

// Calibration
export { ScaleCalibration } from './ScaleCalibration'
export { ScaleCalibrationInteractive } from './ScaleCalibrationInteractive'

// Gestion des coûts
export { PriceListImporter } from './PriceListImporter'
export { WorkCrewManager } from './WorkCrewManager'

// Option C - Optimisation gros fichiers
export { PDFProgressiveLoader, usePDFProgressiveLoader } from './PDFProgressiveLoader'

// Option D - Viewer IFC 3D
export { IFCViewer } from './IFCViewer'
export { IFCViewer3D } from './IFCViewer3D'

// Option E - Liaison Takeoff → Soumission
export { TakeoffToSoumission } from './TakeoffToSoumission'

// Option F - Annotations sur plans
export { 
  AnnotationToolbar, 
  TextAnnotationEditor, 
  NoteAnnotationEditor,
  drawAnnotations,
  createAnnotation,
  generateAnnotationId
} from './PlanAnnotations'
export type { Annotation, AnnotationType } from './PlanAnnotations'

// Option G - Export PDF annoté
export { PDFExporter } from './PDFExporter'
