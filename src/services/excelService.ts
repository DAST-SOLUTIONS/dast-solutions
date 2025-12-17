/**
 * DAST Solutions - Service Import/Export Excel
 * Gestion des fichiers Excel pour les estimations, devis, et projets
 */
import * as XLSX from 'xlsx'

// ============================================================================
// TYPES
// ============================================================================

export interface ExportColumn {
  key: string
  header: string
  width?: number
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date'
}

export interface ImportMapping {
  sourceColumn: string
  targetField: string
  transform?: (value: any) => any
}

export interface ExportOptions {
  filename: string
  sheetName?: string
  columns: ExportColumn[]
  data: any[]
  includeHeaders?: boolean
  autoWidth?: boolean
}

export interface ImportResult<T> {
  success: boolean
  data: T[]
  errors: { row: number; message: string }[]
  warnings: string[]
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Exporte des données vers un fichier Excel
 */
export function exportToExcel(options: ExportOptions): void {
  const {
    filename,
    sheetName = 'Données',
    columns,
    data,
    includeHeaders = true,
    autoWidth = true
  } = options

  // Créer le workbook
  const wb = XLSX.utils.book_new()

  // Préparer les données
  const rows: any[][] = []

  // Headers
  if (includeHeaders) {
    rows.push(columns.map(col => col.header))
  }

  // Data rows
  data.forEach(item => {
    const row = columns.map(col => {
      const value = item[col.key]
      
      // Formatage selon le type
      switch (col.format) {
        case 'currency':
          return typeof value === 'number' ? value : parseFloat(value) || 0
        case 'percent':
          return typeof value === 'number' ? value / 100 : parseFloat(value) / 100 || 0
        case 'date':
          return value ? new Date(value) : ''
        case 'number':
          return typeof value === 'number' ? value : parseFloat(value) || 0
        default:
          return value ?? ''
      }
    })
    rows.push(row)
  })

  // Créer la feuille
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Définir les largeurs de colonnes
  if (autoWidth) {
    ws['!cols'] = columns.map((col, i) => ({
      wch: col.width || Math.max(
        col.header.length,
        ...rows.slice(1).map(row => String(row[i] || '').length)
      ) + 2
    }))
  }

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Télécharger
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * Exporte une estimation vers Excel avec formatage professionnel
 */
export function exportEstimationToExcel(
  projectName: string,
  clientName: string,
  items: Array<{
    category: string
    description: string
    quantity: number
    unit: string
    unitPrice: number
    total: number
  }>,
  options?: {
    includeMargins?: boolean
    marginPercent?: number
    includeTaxes?: boolean
    tpsRate?: number
    tvqRate?: number
  }
): void {
  const {
    includeMargins = true,
    marginPercent = 15,
    includeTaxes = true,
    tpsRate = 5,
    tvqRate = 9.975
  } = options || {}

  const wb = XLSX.utils.book_new()

  // Calculer les totaux
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const margin = includeMargins ? subtotal * (marginPercent / 100) : 0
  const totalBeforeTax = subtotal + margin
  const tps = includeTaxes ? totalBeforeTax * (tpsRate / 100) : 0
  const tvq = includeTaxes ? totalBeforeTax * (tvqRate / 100) : 0
  const grandTotal = totalBeforeTax + tps + tvq

  // Créer les données
  const rows: any[][] = [
    // En-tête
    ['ESTIMATION DE PROJET'],
    [],
    ['Projet:', projectName],
    ['Client:', clientName],
    ['Date:', new Date().toLocaleDateString('fr-CA')],
    [],
    // Headers tableau
    ['Catégorie', 'Description', 'Quantité', 'Unité', 'Prix unit.', 'Total'],
    // Items
    ...items.map(item => [
      item.category,
      item.description,
      item.quantity,
      item.unit,
      item.unitPrice,
      item.total
    ]),
    [],
    // Totaux
    ['', '', '', '', 'Sous-total:', subtotal],
  ]

  if (includeMargins) {
    rows.push(['', '', '', '', `Marge (${marginPercent}%):`, margin])
    rows.push(['', '', '', '', 'Total HT:', totalBeforeTax])
  }

  if (includeTaxes) {
    rows.push(['', '', '', '', `TPS (${tpsRate}%):`, tps])
    rows.push(['', '', '', '', `TVQ (${tvqRate}%):`, tvq])
  }

  rows.push(['', '', '', '', 'TOTAL:', grandTotal])

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Largeurs de colonnes
  ws['!cols'] = [
    { wch: 20 }, // Catégorie
    { wch: 40 }, // Description
    { wch: 12 }, // Quantité
    { wch: 10 }, // Unité
    { wch: 15 }, // Prix unit.
    { wch: 15 }, // Total
  ]

  // Fusionner les cellules du titre
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Estimation')

  // Télécharger
  const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_')
  XLSX.writeFile(wb, `estimation_${safeProjectName}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

/**
 * Exporte une soumission vers Excel avec formatage professionnel
 */
export function exportSoumissionToExcel(
  soumissionNumber: string,
  projectName: string,
  clientInfo: {
    name: string
    address?: string
    city?: string
    email?: string
    phone?: string
  },
  items: Array<{
    description: string
    quantity: number
    unit: string
    unitPrice: number
    total: number
  }>,
  conditions?: string[],
  validityDays?: number
): void {
  const wb = XLSX.utils.book_new()

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const tps = subtotal * 0.05
  const tvq = subtotal * 0.09975
  const total = subtotal + tps + tvq

  const rows: any[][] = [
    ['SOUMISSION'],
    [],
    ['Numéro:', soumissionNumber],
    ['Date:', new Date().toLocaleDateString('fr-CA')],
    ['Validité:', `${validityDays || 30} jours`],
    [],
    ['CLIENT'],
    ['Nom:', clientInfo.name],
    ['Adresse:', clientInfo.address || ''],
    ['Ville:', clientInfo.city || ''],
    ['Courriel:', clientInfo.email || ''],
    ['Téléphone:', clientInfo.phone || ''],
    [],
    ['PROJET:', projectName],
    [],
    ['DÉTAIL DES TRAVAUX'],
    ['Description', 'Qté', 'Unité', 'Prix unit.', 'Total'],
    ...items.map(item => [
      item.description,
      item.quantity,
      item.unit,
      item.unitPrice,
      item.total
    ]),
    [],
    ['', '', '', 'Sous-total:', subtotal],
    ['', '', '', 'TPS (5%):', tps],
    ['', '', '', 'TVQ (9.975%):', tvq],
    ['', '', '', 'TOTAL:', total],
    [],
    ['CONDITIONS:'],
    ...(conditions || ['Paiement: 50% à la signature, 50% à la fin des travaux']).map(c => [c])
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)

  ws['!cols'] = [
    { wch: 50 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Soumission')

  XLSX.writeFile(wb, `soumission_${soumissionNumber}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

/**
 * Exporte les projets vers Excel
 */
export function exportProjectsToExcel(
  projects: Array<{
    name: string
    client_name?: string
    status: string
    start_date?: string
    deadline?: string
    address?: string
    project_value?: number
    progress?: number
  }>
): void {
  exportToExcel({
    filename: `projets_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Projets',
    columns: [
      { key: 'name', header: 'Nom du projet', width: 30 },
      { key: 'client_name', header: 'Client', width: 25 },
      { key: 'status', header: 'Statut', width: 15 },
      { key: 'start_date', header: 'Date début', width: 12, format: 'date' },
      { key: 'deadline', header: 'Échéance', width: 12, format: 'date' },
      { key: 'address', header: 'Adresse', width: 35 },
      { key: 'project_value', header: 'Valeur ($)', width: 15, format: 'currency' },
      { key: 'progress', header: 'Avancement', width: 12, format: 'percent' },
    ],
    data: projects
  })
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Lit un fichier Excel et retourne les données brutes
 */
export async function readExcelFile(file: File): Promise<{
  sheets: string[]
  data: Record<string, any[][]>
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true })
        
        const sheets = workbook.SheetNames
        const sheetsData: Record<string, any[][]> = {}
        
        sheets.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName]
          sheetsData[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        })
        
        resolve({ sheets, data: sheetsData })
      } catch (err) {
        reject(err)
      }
    }
    
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}

/**
 * Importe des items d'estimation depuis Excel
 */
export async function importEstimationFromExcel(
  file: File,
  mapping?: {
    categoryColumn?: number
    descriptionColumn?: number
    quantityColumn?: number
    unitColumn?: number
    unitPriceColumn?: number
  }
): Promise<ImportResult<{
  category: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
}>> {
  const result: ImportResult<any> = {
    success: true,
    data: [],
    errors: [],
    warnings: []
  }

  try {
    const { data } = await readExcelFile(file)
    const sheetData = Object.values(data)[0] // Première feuille

    if (!sheetData || sheetData.length < 2) {
      result.success = false
      result.errors.push({ row: 0, message: 'Fichier vide ou format invalide' })
      return result
    }

    // Mapping par défaut
    const cols = {
      category: mapping?.categoryColumn ?? 0,
      description: mapping?.descriptionColumn ?? 1,
      quantity: mapping?.quantityColumn ?? 2,
      unit: mapping?.unitColumn ?? 3,
      unitPrice: mapping?.unitPriceColumn ?? 4
    }

    // Ignorer la première ligne (headers)
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i]
      
      if (!row || row.length === 0 || !row[cols.description]) {
        continue // Ligne vide
      }

      try {
        const quantity = parseFloat(row[cols.quantity]) || 0
        const unitPrice = parseFloat(row[cols.unitPrice]) || 0

        result.data.push({
          category: row[cols.category] || 'Autre',
          description: row[cols.description] || '',
          quantity,
          unit: row[cols.unit] || 'unité',
          unitPrice,
          total: quantity * unitPrice
        })
      } catch (err) {
        result.errors.push({ row: i + 1, message: `Erreur de conversion: ${err}` })
      }
    }

    if (result.data.length === 0) {
      result.success = false
      result.errors.push({ row: 0, message: 'Aucune donnée valide trouvée' })
    }
  } catch (err) {
    result.success = false
    result.errors.push({ row: 0, message: `Erreur lecture fichier: ${err}` })
  }

  return result
}

/**
 * Importe des projets depuis Excel
 */
export async function importProjectsFromExcel(
  file: File
): Promise<ImportResult<{
  name: string
  client_name?: string
  description?: string
  address?: string
  status?: string
  start_date?: Date
  deadline?: Date
  project_value?: number
}>> {
  const result: ImportResult<any> = {
    success: true,
    data: [],
    errors: [],
    warnings: []
  }

  try {
    const { data } = await readExcelFile(file)
    const sheetData = Object.values(data)[0]

    if (!sheetData || sheetData.length < 2) {
      result.success = false
      result.errors.push({ row: 0, message: 'Fichier vide ou format invalide' })
      return result
    }

    // Détecter les colonnes par les headers
    const headers = sheetData[0].map((h: any) => String(h).toLowerCase().trim())
    
    const findCol = (names: string[]) => {
      return headers.findIndex((h: string) => names.some(n => h.includes(n)))
    }

    const cols = {
      name: findCol(['nom', 'projet', 'name', 'project']),
      client: findCol(['client', 'customer']),
      description: findCol(['description', 'desc']),
      address: findCol(['adresse', 'address', 'lieu', 'location']),
      status: findCol(['statut', 'status', 'état']),
      startDate: findCol(['début', 'start', 'commencement']),
      deadline: findCol(['échéance', 'deadline', 'fin', 'end']),
      value: findCol(['valeur', 'value', 'montant', 'budget'])
    }

    if (cols.name === -1) {
      result.success = false
      result.errors.push({ row: 1, message: 'Colonne "Nom" non trouvée' })
      return result
    }

    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i]
      
      if (!row || !row[cols.name]) continue

      try {
        const project: any = {
          name: row[cols.name]
        }

        if (cols.client !== -1) project.client_name = row[cols.client]
        if (cols.description !== -1) project.description = row[cols.description]
        if (cols.address !== -1) project.address = row[cols.address]
        if (cols.status !== -1) project.status = row[cols.status]
        
        if (cols.startDate !== -1 && row[cols.startDate]) {
          project.start_date = row[cols.startDate] instanceof Date 
            ? row[cols.startDate] 
            : new Date(row[cols.startDate])
        }
        
        if (cols.deadline !== -1 && row[cols.deadline]) {
          project.deadline = row[cols.deadline] instanceof Date 
            ? row[cols.deadline] 
            : new Date(row[cols.deadline])
        }
        
        if (cols.value !== -1 && row[cols.value]) {
          project.project_value = parseFloat(row[cols.value]) || 0
        }

        result.data.push(project)
      } catch (err) {
        result.errors.push({ row: i + 1, message: `Erreur ligne ${i + 1}: ${err}` })
      }
    }

    if (result.data.length === 0) {
      result.success = false
      result.errors.push({ row: 0, message: 'Aucun projet valide trouvé' })
    } else {
      result.warnings.push(`${result.data.length} projet(s) importé(s)`)
    }
  } catch (err) {
    result.success = false
    result.errors.push({ row: 0, message: `Erreur lecture fichier: ${err}` })
  }

  return result
}

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Télécharge un template Excel vide pour l'import
 */
export function downloadImportTemplate(type: 'estimation' | 'projects' | 'clients'): void {
  const templates: Record<string, { headers: string[]; sample: any[] }> = {
    estimation: {
      headers: ['Catégorie', 'Description', 'Quantité', 'Unité', 'Prix unitaire'],
      sample: [
        ['Structure', 'Colombages 2x6', 150, 'pi.l.', 4.25],
        ['Finitions', 'Gypse 1/2"', 100, 'm²', 8.50],
        ['Portes', 'Porte intérieure', 5, 'unité', 350],
      ]
    },
    projects: {
      headers: ['Nom du projet', 'Client', 'Description', 'Adresse', 'Statut', 'Date début', 'Échéance', 'Valeur'],
      sample: [
        ['Rénovation Bureau', 'ABC Corp', 'Rénovation complète', '123 Rue Test', 'active', '2024-01-15', '2024-06-30', 150000],
      ]
    },
    clients: {
      headers: ['Nom', 'Entreprise', 'Courriel', 'Téléphone', 'Adresse', 'Ville', 'Province', 'Code postal'],
      sample: [
        ['Jean Dupont', 'ABC Construction', 'jean@abc.ca', '514-555-1234', '123 Rue Test', 'Montréal', 'QC', 'H1A 1A1'],
      ]
    }
  }

  const template = templates[type]
  if (!template) return

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([template.headers, ...template.sample])

  ws['!cols'] = template.headers.map(() => ({ wch: 20 }))

  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, `template_${type}.xlsx`)
}
