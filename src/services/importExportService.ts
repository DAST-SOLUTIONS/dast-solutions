/**
 * DAST Solutions - Service Import/Export
 * Gestion des imports Excel/CSV et exports PDF/Excel
 */
import { supabase } from '@/lib/supabase'

// Types
export interface ImportConfig {
  category: string
  file: File
  sheetName?: string
  mapping: ColumnMapping[]
  skipRows?: number
  dateFormat?: string
}

export interface ColumnMapping {
  sourceColumn: string
  targetField: string
  transform?: 'text' | 'number' | 'date' | 'currency' | 'percent' | 'boolean'
  defaultValue?: any
}

export interface ExportConfig {
  category: string
  format: 'excel' | 'csv' | 'pdf' | 'json'
  templateId?: string
  filters?: Record<string, any>
  fields?: string[]
  filename?: string
}

export interface ImportResult {
  success: boolean
  totalRows: number
  importedRows: number
  skippedRows: number
  errors: ImportError[]
}

export interface ImportError {
  row: number
  column: string
  value: any
  message: string
}

// Service principal
class ImportExportService {
  private userId: string | null = null

  async initialize(userId: string) {
    this.userId = userId
  }

  // ============================================================
  // IMPORT FUNCTIONS
  // ============================================================

  /**
   * Lire les feuilles d'un fichier Excel
   */
  async getExcelSheets(file: File): Promise<string[]> {
    // En production, utiliser SheetJS (xlsx)
    // import * as XLSX from 'xlsx'
    // const data = await file.arrayBuffer()
    // const workbook = XLSX.read(data)
    // return workbook.SheetNames
    
    // Simulation
    return ['Feuille1', 'Données', 'Import']
  }

  /**
   * Prévisualiser les données d'un fichier
   */
  async previewFile(file: File, sheetName?: string, maxRows: number = 10): Promise<{
    headers: string[]
    rows: any[][]
    totalRows: number
  }> {
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'csv') {
      return this.previewCSV(file, maxRows)
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      return this.previewExcel(file, sheetName, maxRows)
    } else if (extension === 'json') {
      return this.previewJSON(file, maxRows)
    }

    throw new Error('Format de fichier non supporté')
  }

  private async previewCSV(file: File, maxRows: number): Promise<{
    headers: string[]
    rows: any[][]
    totalRows: number
  }> {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return { headers: [], rows: [], totalRows: 0 }
    }

    const headers = this.parseCSVLine(lines[0])
    const rows = lines.slice(1, maxRows + 1).map(line => this.parseCSVLine(line))

    return {
      headers,
      rows,
      totalRows: lines.length - 1
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())

    return result
  }

  private async previewExcel(file: File, sheetName?: string, maxRows: number = 10): Promise<{
    headers: string[]
    rows: any[][]
    totalRows: number
  }> {
    // En production, utiliser SheetJS
    // Simulation pour le prototype
    return {
      headers: ['Colonne A', 'Colonne B', 'Colonne C', 'Colonne D'],
      rows: [
        ['Valeur 1', 'Valeur 2', 100, '2025-01-15'],
        ['Valeur 3', 'Valeur 4', 200, '2025-02-20'],
        ['Valeur 5', 'Valeur 6', 300, '2025-03-25'],
      ],
      totalRows: 50
    }
  }

  private async previewJSON(file: File, maxRows: number): Promise<{
    headers: string[]
    rows: any[][]
    totalRows: number
  }> {
    const text = await file.text()
    const data = JSON.parse(text)
    
    const items = Array.isArray(data) ? data : [data]
    if (items.length === 0) {
      return { headers: [], rows: [], totalRows: 0 }
    }

    const headers = Object.keys(items[0])
    const rows = items.slice(0, maxRows).map(item => 
      headers.map(h => item[h])
    )

    return {
      headers,
      rows,
      totalRows: items.length
    }
  }

  /**
   * Importer les données
   */
  async importData(config: ImportConfig): Promise<ImportResult> {
    if (!this.userId) {
      throw new Error('Utilisateur non authentifié')
    }

    const { category, file, mapping, skipRows = 0 } = config
    const result: ImportResult = {
      success: false,
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
      errors: []
    }

    try {
      // Lire le fichier
      const preview = await this.previewFile(file, config.sheetName, 10000)
      result.totalRows = preview.totalRows

      // Mapper et valider les données
      const mappedData: any[] = []

      for (let i = skipRows; i < preview.rows.length; i++) {
        const row = preview.rows[i]
        const mappedRow: Record<string, any> = {
          user_id: this.userId
        }

        let hasError = false

        for (const map of mapping) {
          const columnIndex = preview.headers.indexOf(map.sourceColumn)
          if (columnIndex === -1) continue

          let value = row[columnIndex]

          // Appliquer la transformation
          try {
            value = this.transformValue(value, map.transform)
          } catch (err) {
            result.errors.push({
              row: i + 1,
              column: map.sourceColumn,
              value,
              message: `Erreur de conversion: ${err}`
            })
            hasError = true
            continue
          }

          mappedRow[map.targetField] = value ?? map.defaultValue
        }

        if (!hasError) {
          mappedData.push(mappedRow)
        } else {
          result.skippedRows++
        }
      }

      // Insérer dans la base de données
      if (mappedData.length > 0) {
        const tableName = this.getTableName(category)
        
        const { data, error } = await supabase
          .from(tableName)
          .insert(mappedData)
          .select()

        if (error) {
          throw error
        }

        result.importedRows = data?.length || 0
      }

      result.success = result.errors.length === 0

      // Logger l'import
      await this.logImport(config, result)

    } catch (err: any) {
      result.errors.push({
        row: 0,
        column: '',
        value: null,
        message: err.message
      })
    }

    return result
  }

  private transformValue(value: any, transform?: string): any {
    if (value === null || value === undefined || value === '') {
      return null
    }

    switch (transform) {
      case 'number':
        const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''))
        if (isNaN(num)) throw new Error('Valeur numérique invalide')
        return num

      case 'currency':
        const currency = parseFloat(String(value).replace(/[$€,\s]/g, ''))
        if (isNaN(currency)) throw new Error('Montant invalide')
        return currency

      case 'percent':
        const pct = parseFloat(String(value).replace(/%/g, ''))
        if (isNaN(pct)) throw new Error('Pourcentage invalide')
        return pct

      case 'date':
        const date = new Date(value)
        if (isNaN(date.getTime())) throw new Error('Date invalide')
        return date.toISOString().split('T')[0]

      case 'boolean':
        const lower = String(value).toLowerCase()
        return ['true', 'oui', 'yes', '1', 'x'].includes(lower)

      case 'text':
      default:
        return String(value).trim()
    }
  }

  private getTableName(category: string): string {
    const mapping: Record<string, string> = {
      projects: 'projects',
      clients: 'clients',
      soumissions: 'soumissions',
      factures: 'invoices',
      materials: 'materials',
      employees: 'employees',
      timesheet: 'timesheets'
    }
    return mapping[category] || category
  }

  private async logImport(config: ImportConfig, result: ImportResult) {
    if (!this.userId) return

    await supabase.from('import_history').insert({
      user_id: this.userId,
      category: config.category,
      filename: config.file.name,
      file_size: config.file.size,
      total_rows: result.totalRows,
      imported_rows: result.importedRows,
      skipped_rows: result.skippedRows,
      error_count: result.errors.length,
      success: result.success
    })
  }

  // ============================================================
  // EXPORT FUNCTIONS
  // ============================================================

  /**
   * Exporter les données
   */
  async exportData(config: ExportConfig): Promise<Blob> {
    if (!this.userId) {
      throw new Error('Utilisateur non authentifié')
    }

    // Charger les données
    const data = await this.loadExportData(config.category, config.filters)

    // Charger le template si spécifié
    let template = null
    if (config.templateId) {
      const { data: tpl } = await supabase
        .from('export_templates')
        .select('*')
        .eq('id', config.templateId)
        .single()
      template = tpl
    }

    // Générer l'export selon le format
    switch (config.format) {
      case 'excel':
        return this.generateExcel(data, template, config)
      case 'csv':
        return this.generateCSV(data, config)
      case 'pdf':
        return this.generatePDF(data, template, config)
      case 'json':
        return this.generateJSON(data, config)
      default:
        throw new Error('Format non supporté')
    }
  }

  private async loadExportData(category: string, filters?: Record<string, any>): Promise<any[]> {
    const tableName = this.getTableName(category)
    
    let query = supabase
      .from(tableName)
      .select('*')
      .eq('user_id', this.userId)

    // Appliquer les filtres
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined && value !== '') {
          query = query.eq(key, value)
        }
      }
    }

    const { data, error } = await query.limit(10000)
    
    if (error) throw error
    return data || []
  }

  private async generateExcel(data: any[], template: any, config: ExportConfig): Promise<Blob> {
    // En production, utiliser SheetJS (xlsx)
    // import * as XLSX from 'xlsx'
    // const ws = XLSX.utils.json_to_sheet(data)
    // const wb = XLSX.utils.book_new()
    // XLSX.utils.book_append_sheet(wb, ws, 'Export')
    // return new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })])

    // Simulation - retourner un fichier texte pour le prototype
    const headers = Object.keys(data[0] || {})
    let content = headers.join('\t') + '\n'
    
    for (const row of data) {
      content += headers.map(h => row[h] ?? '').join('\t') + '\n'
    }

    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  private generateCSV(data: any[], config: ExportConfig): Blob {
    const headers = Object.keys(data[0] || {})
    let content = headers.join(',') + '\n'
    
    for (const row of data) {
      const values = headers.map(h => {
        const val = row[h]
        if (val === null || val === undefined) return ''
        const str = String(val)
        // Échapper les guillemets et entourer si contient virgule
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"'
        }
        return str
      })
      content += values.join(',') + '\n'
    }

    return new Blob([content], { type: 'text/csv;charset=utf-8' })
  }

  private async generatePDF(data: any[], template: any, config: ExportConfig): Promise<Blob> {
    // En production, utiliser jsPDF ou pdfmake
    // import jsPDF from 'jspdf'
    // import 'jspdf-autotable'
    
    // Simulation
    const content = `PDF Export - ${config.category}\n\n${JSON.stringify(data, null, 2)}`
    return new Blob([content], { type: 'application/pdf' })
  }

  private generateJSON(data: any[], config: ExportConfig): Blob {
    const content = JSON.stringify(data, null, 2)
    return new Blob([content], { type: 'application/json' })
  }

  /**
   * Télécharger un export
   */
  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Générer le nom de fichier
   */
  generateFilename(category: string, format: string): string {
    const date = new Date().toISOString().split('T')[0]
    return `export_${category}_${date}.${format === 'excel' ? 'xlsx' : format}`
  }
}

// Instance singleton
export const importExportService = new ImportExportService()

// Hook pour utiliser le service
export function useImportExport() {
  return importExportService
}
