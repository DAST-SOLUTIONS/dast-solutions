/**
 * DAST Solutions - PlanAnnotations
 * Annotations sur plans: Texte, flèches, notes, formes
 * Option F - Complet
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Type, ArrowRight, StickyNote, Circle, Square, Trash2,
  Palette, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  ChevronDown, X, Check, Move, RotateCw
} from 'lucide-react'

// Types d'annotations
export type AnnotationType = 'text' | 'arrow' | 'note' | 'circle' | 'rectangle' | 'freehand'

export interface Annotation {
  id: string
  type: AnnotationType
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  color: string
  backgroundColor?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'
  rotation?: number
  points?: { x: number; y: number }[] // Pour flèches et freehand
  endX?: number // Pour flèches
  endY?: number
  opacity?: number
  borderWidth?: number
  planId?: string
  page?: number
  createdAt: Date
  updatedAt: Date
}

interface PlanAnnotationsProps {
  annotations: Annotation[]
  onAnnotationsChange: (annotations: Annotation[]) => void
  activeTool: AnnotationType | null
  onToolChange: (tool: AnnotationType | null) => void
  selectedAnnotation: string | null
  onSelectAnnotation: (id: string | null) => void
  currentColor?: string
  onColorChange?: (color: string) => void
}

// Couleurs prédéfinies
const PRESET_COLORS = [
  '#EF4444', // Rouge
  '#F97316', // Orange
  '#EAB308', // Jaune
  '#22C55E', // Vert
  '#14B8A6', // Teal
  '#3B82F6', // Bleu
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#000000', // Noir
  '#6B7280', // Gris
]

// Outils d'annotation
const ANNOTATION_TOOLS = [
  { type: 'text' as AnnotationType, icon: Type, label: 'Texte', shortcut: 'T' },
  { type: 'arrow' as AnnotationType, icon: ArrowRight, label: 'Flèche', shortcut: 'A' },
  { type: 'note' as AnnotationType, icon: StickyNote, label: 'Note', shortcut: 'N' },
  { type: 'circle' as AnnotationType, icon: Circle, label: 'Cercle', shortcut: 'O' },
  { type: 'rectangle' as AnnotationType, icon: Square, label: 'Rectangle', shortcut: 'B' },
]

export function AnnotationToolbar({
  activeTool,
  onToolChange,
  currentColor = '#EF4444',
  onColorChange
}: {
  activeTool: AnnotationType | null
  onToolChange: (tool: AnnotationType | null) => void
  currentColor?: string
  onColorChange?: (color: string) => void
}) {
  const [showColorPicker, setShowColorPicker] = useState(false)

  return (
    <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
      {ANNOTATION_TOOLS.map(tool => (
        <button
          key={tool.type}
          onClick={() => onToolChange(activeTool === tool.type ? null : tool.type)}
          title={`${tool.label} (${tool.shortcut})`}
          className={`p-2 rounded transition ${
            activeTool === tool.type 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-300 hover:bg-gray-600'
          }`}
        >
          <tool.icon size={18} />
        </button>
      ))}

      <div className="h-6 w-px bg-gray-500 mx-1" />

      {/* Color picker */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 rounded hover:bg-gray-600 flex items-center gap-1"
        >
          <div 
            className="w-5 h-5 rounded border-2 border-white"
            style={{ backgroundColor: currentColor }}
          />
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded-lg shadow-xl p-2 z-50">
            <div className="grid grid-cols-5 gap-1">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    onColorChange?.(color)
                    setShowColorPicker(false)
                  }}
                  className={`w-6 h-6 rounded border-2 transition ${
                    color === currentColor ? 'border-white scale-110' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onColorChange?.(e.target.value)}
              className="w-full h-8 mt-2 cursor-pointer rounded"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Éditeur de texte pour annotations
export function TextAnnotationEditor({
  annotation,
  onSave,
  onCancel
}: {
  annotation: Partial<Annotation>
  onSave: (annotation: Partial<Annotation>) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(annotation.text || '')
  const [fontSize, setFontSize] = useState(annotation.fontSize || 14)
  const [fontWeight, setFontWeight] = useState(annotation.fontWeight || 'normal')
  const [fontStyle, setFontStyle] = useState(annotation.fontStyle || 'normal')
  const [textAlign, setTextAlign] = useState(annotation.textAlign || 'left')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 min-w-[300px]">
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
          className={`p-2 rounded ${fontWeight === 'bold' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
          className={`p-2 rounded ${fontStyle === 'italic' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <Italic size={16} />
        </button>
        <div className="h-6 w-px bg-gray-300" />
        <button
          onClick={() => setTextAlign('left')}
          className={`p-2 rounded ${textAlign === 'left' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => setTextAlign('center')}
          className={`p-2 rounded ${textAlign === 'center' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => setTextAlign('right')}
          className={`p-2 rounded ${textAlign === 'right' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <AlignRight size={16} />
        </button>
        <div className="h-6 w-px bg-gray-300" />
        <select
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="px-2 py-1 border rounded text-sm"
        >
          {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Entrez votre texte..."
        className="w-full h-24 px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        style={{
          fontWeight,
          fontStyle,
          textAlign,
          fontSize: `${fontSize}px`
        }}
      />

      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Annuler
        </button>
        <button
          onClick={() => onSave({ ...annotation, text, fontSize, fontWeight, fontStyle, textAlign })}
          disabled={!text.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <Check size={16} className="inline mr-1" />
          Enregistrer
        </button>
      </div>
    </div>
  )
}

// Éditeur de note (post-it style)
export function NoteAnnotationEditor({
  annotation,
  onSave,
  onCancel
}: {
  annotation: Partial<Annotation>
  onSave: (annotation: Partial<Annotation>) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(annotation.text || '')
  const [bgColor, setBgColor] = useState(annotation.backgroundColor || '#FEF08A')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const noteColors = [
    '#FEF08A', // Jaune
    '#FED7AA', // Orange
    '#FECACA', // Rouge
    '#BBF7D0', // Vert
    '#BFDBFE', // Bleu
    '#DDD6FE', // Violet
  ]

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  return (
    <div 
      className="rounded-lg shadow-xl p-4 min-w-[250px]"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-center gap-1 mb-3">
        {noteColors.map(color => (
          <button
            key={color}
            onClick={() => setBgColor(color)}
            className={`w-6 h-6 rounded border-2 ${
              color === bgColor ? 'border-gray-600 scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ajouter une note..."
        className="w-full h-32 px-3 py-2 bg-transparent border-none resize-none focus:outline-none text-gray-800"
      />

      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-600 hover:bg-black/10 rounded"
        >
          <X size={16} />
        </button>
        <button
          onClick={() => onSave({ ...annotation, text, backgroundColor: bgColor })}
          disabled={!text.trim()}
          className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          <Check size={16} />
        </button>
      </div>
    </div>
  )
}

// Fonction pour dessiner les annotations sur le canvas
export function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: Annotation[],
  selectedId: string | null
) {
  annotations.forEach(ann => {
    const isSelected = ann.id === selectedId

    ctx.save()

    // Appliquer rotation si nécessaire
    if (ann.rotation) {
      ctx.translate(ann.x + (ann.width || 0) / 2, ann.y + (ann.height || 0) / 2)
      ctx.rotate((ann.rotation * Math.PI) / 180)
      ctx.translate(-(ann.x + (ann.width || 0) / 2), -(ann.y + (ann.height || 0) / 2))
    }

    switch (ann.type) {
      case 'text':
        ctx.font = `${ann.fontStyle || 'normal'} ${ann.fontWeight || 'normal'} ${ann.fontSize || 14}px sans-serif`
        ctx.fillStyle = ann.color
        ctx.textAlign = ann.textAlign || 'left'
        ctx.textBaseline = 'top'
        
        // Multi-ligne support
        const lines = (ann.text || '').split('\n')
        lines.forEach((line, i) => {
          ctx.fillText(line, ann.x, ann.y + i * (ann.fontSize || 14) * 1.2)
        })
        
        // Selection box
        if (isSelected) {
          const metrics = ctx.measureText(ann.text || '')
          ctx.strokeStyle = '#8B5CF6'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 3])
          ctx.strokeRect(ann.x - 4, ann.y - 4, metrics.width + 8, (ann.fontSize || 14) * lines.length * 1.2 + 8)
          ctx.setLineDash([])
        }
        break

      case 'arrow':
        if (ann.endX !== undefined && ann.endY !== undefined) {
          const headlen = 15
          const dx = ann.endX - ann.x
          const dy = ann.endY - ann.y
          const angle = Math.atan2(dy, dx)

          ctx.strokeStyle = ann.color
          ctx.fillStyle = ann.color
          ctx.lineWidth = ann.borderWidth || 3

          // Ligne
          ctx.beginPath()
          ctx.moveTo(ann.x, ann.y)
          ctx.lineTo(ann.endX, ann.endY)
          ctx.stroke()

          // Tête de flèche
          ctx.beginPath()
          ctx.moveTo(ann.endX, ann.endY)
          ctx.lineTo(ann.endX - headlen * Math.cos(angle - Math.PI / 6), ann.endY - headlen * Math.sin(angle - Math.PI / 6))
          ctx.lineTo(ann.endX - headlen * Math.cos(angle + Math.PI / 6), ann.endY - headlen * Math.sin(angle + Math.PI / 6))
          ctx.closePath()
          ctx.fill()

          // Selection
          if (isSelected) {
            ctx.fillStyle = '#8B5CF6'
            ctx.beginPath()
            ctx.arc(ann.x, ann.y, 6, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(ann.endX, ann.endY, 6, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        break

      case 'note':
        const noteWidth = ann.width || 200
        const noteHeight = ann.height || 150

        // Ombre
        ctx.shadowColor = 'rgba(0,0,0,0.2)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 3
        ctx.shadowOffsetY = 3

        // Fond
        ctx.fillStyle = ann.backgroundColor || '#FEF08A'
        ctx.fillRect(ann.x, ann.y, noteWidth, noteHeight)

        // Reset shadow
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        // Bordure
        if (isSelected) {
          ctx.strokeStyle = '#8B5CF6'
          ctx.lineWidth = 3
          ctx.strokeRect(ann.x, ann.y, noteWidth, noteHeight)
        }

        // Texte
        ctx.font = '14px sans-serif'
        ctx.fillStyle = '#1F2937'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        
        const noteLines = (ann.text || '').split('\n')
        noteLines.forEach((line, i) => {
          ctx.fillText(line, ann.x + 10, ann.y + 10 + i * 18)
        })
        break

      case 'circle':
        const radius = Math.sqrt(Math.pow(ann.width || 50, 2) + Math.pow(ann.height || 50, 2)) / 2
        
        ctx.strokeStyle = ann.color
        ctx.lineWidth = ann.borderWidth || 2
        ctx.beginPath()
        ctx.arc(ann.x, ann.y, radius, 0, Math.PI * 2)
        ctx.stroke()

        if (ann.backgroundColor) {
          ctx.fillStyle = ann.backgroundColor + '40'
          ctx.fill()
        }

        if (isSelected) {
          ctx.strokeStyle = '#8B5CF6'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 3])
          ctx.strokeRect(ann.x - radius - 4, ann.y - radius - 4, radius * 2 + 8, radius * 2 + 8)
          ctx.setLineDash([])
        }
        break

      case 'rectangle':
        const rectWidth = ann.width || 100
        const rectHeight = ann.height || 60

        ctx.strokeStyle = ann.color
        ctx.lineWidth = ann.borderWidth || 2
        ctx.strokeRect(ann.x, ann.y, rectWidth, rectHeight)

        if (ann.backgroundColor) {
          ctx.fillStyle = ann.backgroundColor + '40'
          ctx.fillRect(ann.x, ann.y, rectWidth, rectHeight)
        }

        if (isSelected) {
          ctx.strokeStyle = '#8B5CF6'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 3])
          ctx.strokeRect(ann.x - 4, ann.y - 4, rectWidth + 8, rectHeight + 8)
          ctx.setLineDash([])

          // Handles
          const handles = [
            { x: ann.x, y: ann.y },
            { x: ann.x + rectWidth, y: ann.y },
            { x: ann.x, y: ann.y + rectHeight },
            { x: ann.x + rectWidth, y: ann.y + rectHeight }
          ]
          ctx.fillStyle = '#8B5CF6'
          handles.forEach(h => {
            ctx.fillRect(h.x - 4, h.y - 4, 8, 8)
          })
        }
        break

      case 'freehand':
        if (ann.points && ann.points.length > 1) {
          ctx.strokeStyle = ann.color
          ctx.lineWidth = ann.borderWidth || 2
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          ctx.beginPath()
          ctx.moveTo(ann.points[0].x, ann.points[0].y)
          ann.points.forEach((p, i) => {
            if (i > 0) ctx.lineTo(p.x, p.y)
          })
          ctx.stroke()
        }
        break
    }

    ctx.restore()
  })
}

// Génère un nouvel ID
export function generateAnnotationId(): string {
  return `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Créer une nouvelle annotation
export function createAnnotation(
  type: AnnotationType,
  x: number,
  y: number,
  color: string,
  options?: Partial<Annotation>
): Annotation {
  const now = new Date()
  
  return {
    id: generateAnnotationId(),
    type,
    x,
    y,
    color,
    fontSize: 14,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    opacity: 1,
    borderWidth: 2,
    createdAt: now,
    updatedAt: now,
    ...options
  }
}

export default {
  AnnotationToolbar,
  TextAnnotationEditor,
  NoteAnnotationEditor,
  drawAnnotations,
  createAnnotation,
  generateAnnotationId
}
