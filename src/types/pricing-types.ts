/**
 * DAST Solutions - Types pour Prix Matériaux et Soumissions
 */

// ============================================================
// MATÉRIAUX ET PRIX
// ============================================================

export interface MaterialCategory {
  id: string
  division_code: string
  division_name: string
  subdivision_code?: string
  subdivision_name?: string
  description?: string
  icon?: string
  sort_order: number
  is_active: boolean
}

export interface Material {
  id: string
  category_id?: string
  category?: MaterialCategory
  
  // Identification
  code: string
  name: string
  name_en?: string
  description?: string
  
  // Unités
  unit: string
  unit_fr?: string
  default_quantity: number
  
  // Prix
  unit_price: number
  price_type: 'material' | 'labor' | 'equipment' | 'subcontract'
  currency: string
  
  // Fournisseur
  supplier?: string
  supplier_code?: string
  manufacturer?: string
  
  // Métadonnées prix
  price_date: string
  price_source?: string
  price_region: string
  
  // Facteurs
  waste_factor: number
  coverage_rate?: number
  labor_hours_per_unit?: number
  
  // Status
  is_active: boolean
  is_favorite: boolean
  tags?: string[]
  
  // Audit
  created_at: string
  updated_at: string
}

export interface MaterialPriceHistory {
  id: string
  material_id: string
  unit_price: number
  price_date: string
  price_source?: string
  notes?: string
  created_at: string
}

export interface MaterialAssembly {
  id: string
  code: string
  name: string
  description?: string
  category_id?: string
  unit: string
  
  total_material_cost?: number
  total_labor_cost?: number
  total_equipment_cost?: number
  total_cost?: number
  
  items?: AssemblyItem[]
  
  is_active: boolean
  is_template: boolean
  created_at: string
}

export interface AssemblyItem {
  id: string
  assembly_id: string
  material_id: string
  material?: Material
  quantity: number
  sort_order: number
  notes?: string
}

// ============================================================
// TAKEOFF → ESTIMATION (Option B)
// ============================================================

export interface TakeoffMaterialLink {
  id: string
  takeoff_id?: string
  measurement_id?: string
  project_id: string
  
  material_id?: string
  material?: Material
  assembly_id?: string
  assembly?: MaterialAssembly
  
  // Quantités
  measured_quantity: number
  adjusted_quantity: number
  unit: string
  
  // Prix calculés
  unit_price: number
  total_price: number
  labor_hours?: number
  labor_cost?: number
  
  notes?: string
  created_at: string
  updated_at: string
}

export interface EstimationSection {
  id: string
  name: string
  description?: string
  sort_order: number
  items: EstimationItem[]
  subtotal: number
}

export interface EstimationItem {
  id: string
  section_id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  
  material_id?: string
  assembly_id?: string
  takeoff_link_id?: string
  
  is_optional: boolean
  is_included: boolean
  notes?: string
}

// ============================================================
// SOUMISSIONS (Option C)
// ============================================================

export interface SoumissionTemplate {
  id: string
  name: string
  description?: string
  
  header_html?: string
  footer_html?: string
  terms_conditions?: string
  notes_default?: string
  
  logo_url?: string
  primary_color: string
  font_family: string
  
  show_unit_prices: boolean
  show_quantities: boolean
  show_labor_separately: boolean
  include_taxes: boolean
  
  tps_rate: number
  tvq_rate: number
  
  validity_days: number
  
  is_default: boolean
  is_active: boolean
  created_at: string
}

export type SoumissionStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'

export interface SoumissionV2 {
  id: string
  project_id?: string
  client_id?: string
  template_id?: string
  
  numero: string
  revision: number
  status: SoumissionStatus
  
  // Dates
  date_creation: string
  date_envoi?: string
  date_validite?: string
  date_reponse?: string
  
  // Client
  client_name?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  
  // Projet
  project_name?: string
  project_address?: string
  project_description?: string
  
  // Sections
  sections: SoumissionSection[]
  
  // Totaux
  subtotal_materials: number
  subtotal_labor: number
  subtotal_equipment: number
  subtotal_subcontracts: number
  subtotal: number
  
  // Ajustements
  discount_percent: number
  discount_amount: number
  contingency_percent: number
  contingency_amount: number
  profit_percent: number
  profit_amount: number
  
  // Taxes
  tps_amount: number
  tvq_amount: number
  
  grand_total: number
  
  // Termes
  terms_conditions?: string
  notes?: string
  internal_notes?: string
  
  // Signatures
  prepared_by?: string
  prepared_by_title?: string
  signature_entreprise?: string
  signature_client?: string
  date_signature_client?: string
  
  // PDF
  pdf_url?: string
  pdf_generated_at?: string
  
  // Tracking
  viewed_at?: string
  viewed_count: number
  
  created_at: string
  updated_at: string
}

export interface SoumissionSection {
  id: string
  name: string
  description?: string
  sort_order: number
  items: SoumissionItem[]
  subtotal: number
}

export interface SoumissionItem {
  id: string
  soumission_id: string
  section_name?: string
  section_order: number
  item_order: number
  
  description: string
  quantity?: number
  unit?: string
  unit_price?: number
  total_price?: number
  
  material_id?: string
  assembly_id?: string
  takeoff_link_id?: string
  
  is_optional: boolean
  is_included: boolean
  notes?: string
}

// ============================================================
// PWA / MOBILE (Option D)
// ============================================================

export interface RapportTerrainMobile {
  id: string
  project_id: string
  
  // Métadonnées
  date_visite: string
  heure_debut?: string
  heure_fin?: string
  
  // Localisation
  latitude?: number
  longitude?: number
  address?: string
  
  // Météo
  weather_condition?: string
  temperature?: number
  
  // Rapport
  type_visite: 'inspection' | 'progress' | 'safety' | 'quality' | 'punch_list' | 'other'
  description: string
  observations?: string
  
  // Items
  items: RapportTerrainItem[]
  
  // Photos
  photos: RapportPhoto[]
  
  // Signatures
  inspector_name?: string
  inspector_signature?: string
  client_name?: string
  client_signature?: string
  
  // Status
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitted_at?: string
  
  // Sync
  is_synced: boolean
  offline_id?: string
  
  created_at: string
  updated_at: string
}

export interface RapportTerrainItem {
  id: string
  rapport_id: string
  
  category: string
  description: string
  status: 'ok' | 'issue' | 'na' | 'pending'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  notes?: string
  photo_ids?: string[]
  
  // Pour punch list
  responsible?: string
  due_date?: string
  completed_at?: string
}

export interface RapportPhoto {
  id: string
  rapport_id: string
  item_id?: string
  
  url: string
  thumbnail_url?: string
  filename: string
  
  caption?: string
  latitude?: number
  longitude?: number
  
  created_at: string
}

// ============================================================
// FILTRES ET RECHERCHE
// ============================================================

export interface MaterialFilters {
  search?: string
  category_id?: string
  division_code?: string
  price_type?: string
  supplier?: string
  is_favorite?: boolean
  tags?: string[]
  min_price?: number
  max_price?: number
}

export interface SoumissionFilters {
  search?: string
  status?: SoumissionStatus
  project_id?: string
  client_id?: string
  date_from?: string
  date_to?: string
}
