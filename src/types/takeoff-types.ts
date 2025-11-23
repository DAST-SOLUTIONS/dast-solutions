/**
 * DAST Solutions - Types Takeoff
 * Module de relevé de quantités sur plans
 */

export type MeasurementType = 'linear' | 'area' | 'count' | 'volume';

export interface TakeoffDocument {
  id: string;
  project_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  page_count: number;
  created_by?: string;
  created_at: string;

cat > src/types/takeoff-types.ts << 'ENDOFFILE'
/**
 * DAST Solutions - Types Takeoff
 * Module de relevé de quantités sur plans
 */

export type MeasurementType = 'linear' | 'area' | 'count' | 'volume';

export interface TakeoffDocument {
  id: string;
  project_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  page_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TakeoffMeasurement {
  id: string;
  document_id: string;
  project_id: string;
  measurement_type: MeasurementType;
  item_name: string;
  quantity: number;
  unit: string;
  geometry?: any;
  page_number: number;
  notes?: string;
  color: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TakeoffItem {
  id: string;
  project_id: string;
  measurement_id?: string;
  category: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price?: number;
  total_price?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MeasurementTool {
  type: MeasurementType;
  name: string;
  icon: string;
  color: string;
  unit: string;
}
