// Types for pricing and estimation

export interface MaterialCategory {
  id: string;
  code: string;
  name: string;
  name_fr?: string;
  division_code?: string;
  parent_id?: string;
}

export interface Material {
  id: string;
  code?: string;
  name: string;
  name_en?: string;
  description?: string;
  category?: string;
  category_id?: string;
  division_code?: string;
  unit: string;
  unit_fr?: string;
  unit_price: number;
  default_quantity?: number;
  currency?: string;
  supplier?: string;
  supplier_id?: string;
  supplier_code?: string;
  manufacturer?: string;
  price_date?: string;
  price_source?: string;
  price_region?: string;
  waste_factor?: number;
  coverage_rate?: number;
  labor_hours_per_unit?: number;
  is_active?: boolean;
  is_favorite?: boolean;
  tags?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
  price_type?: 'fixed' | 'variable' | 'quote' | 'material' | 'labor' | 'equipment' | 'subcontract';
}

export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  website?: string;
  categories?: string[];
  notes?: string;
  rating?: number;
  is_active?: boolean;
}

export interface PriceQuote {
  id: string;
  material_id: string;
  supplier_id: string;
  unit_price: number;
  quantity?: number;
  total_price?: number;
  valid_from?: string;
  valid_to?: string;
  notes?: string;
  created_at?: string;
}

export interface EstimationItem {
  id: string;
  numero?: number;
  description: string;
  categorie?: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  prixUnitaire?: number;
  montant: number;
  total?: number;
  source: 'takeoff' | 'manual' | 'imported';
  coutMateriel?: number;
  coutMainOeuvre?: number;
  coutEquipement?: number;
  heuresMO?: number;
  tauxMO?: number;
  notes?: string;
}

export interface TakeoffMeasurement {
  id: string;
  type: 'linear' | 'area' | 'count' | 'volume';
  value: number;
  unit: string;
  label?: string;
  layer?: string;
  page?: number;
  coordinates?: { x: number; y: number }[];
  scale?: number;
}

export interface PricingCalculation {
  material_cost: number;
  labor_cost: number;
  equipment_cost: number;
  overhead_cost: number;
  profit: number;
  subtotal: number;
  taxes: {
    tps: number;
    tvq: number;
  };
  total: number;
}

export interface QuebecTaxRates {
  tps: number;
  tvq: number;
}

export const QUEBEC_TAX_RATES: QuebecTaxRates = {
  tps: 0.05,
  tvq: 0.09975
};

export function calculateQuebecTaxes(amount: number): { tps: number; tvq: number; total: number } {
  const tps = amount * QUEBEC_TAX_RATES.tps;
  const tvq = amount * QUEBEC_TAX_RATES.tvq;
  return {
    tps,
    tvq,
    total: amount + tps + tvq
  };
}

export function calculateMaterialCost(
  material: Material, 
  quantity: number, 
  wasteFactor?: number
): { total_price: number; adjusted_quantity: number; unit_price: number; waste_amount?: number; quantity?: number } {
  const waste = wasteFactor || material.waste_factor || 0;
  const adjustedQty = quantity * (1 + waste);
  const totalPrice = adjustedQty * material.unit_price;
  
  return {
    total_price: totalPrice,
    adjusted_quantity: adjustedQty,
    unit_price: material.unit_price,
    waste_amount: waste > 0 ? quantity * waste * material.unit_price : undefined,
    quantity: adjustedQty
  };
}

export interface LaborRate {
  id: string;
  trade: string;
  trade_fr?: string;
  base_rate: number;
  burden_rate?: number;
  total_rate: number;
  overtime_multiplier?: number;
  region?: string;
  effective_date?: string;
}

export interface EquipmentRate {
  id: string;
  name: string;
  type?: string;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  hourly_rate?: number;
  operator_required?: boolean;
  operator_rate?: number;
}

// Soumission V2 Types
export interface SoumissionV2 {
  id: string;
  numero: string;
  titre: string;
  project_id?: string;
  client_id?: string;
  statut: string;
  montant_ht: number;
  tps: number;
  tvq: number;
  montant_total: number;
  sections?: SoumissionSection[];
  items?: SoumissionItem[];
  date_creation: string;
  user_id: string;
}

export interface SoumissionSection {
  id: string;
  nom: string;
  description?: string;
  sort_order: number;
  items?: SoumissionItem[];
  sous_total?: number;
}

export interface SoumissionItem {
  id: string;
  description: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  montant: number;
  categorie?: string;
}

export interface SoumissionTemplate {
  id: string;
  name: string;
  description?: string;
  sections: SoumissionSection[];
}

export interface SoumissionFilters {
  statut?: string;
  client_id?: string;
  project_id?: string;
  dateFrom?: string;
  dateTo?: string;
}
