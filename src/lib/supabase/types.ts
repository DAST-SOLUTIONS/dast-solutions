/**
 * Types générés pour les tables Supabase
 * Structure de la base de données DAST Solutions
 */

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id'>>;
      };
      takeoffs: {
        Row: Takeoff;
        Insert: Omit<Takeoff, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Takeoff, 'id'>>;
      };
      estimates: {
        Row: Estimate;
        Insert: Omit<Estimate, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Estimate, 'id'>>;
      };
      invoices: {
        Row: Invoice;
        Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Invoice, 'id'>>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, 'id' | 'created_at'>;
        Update: Partial<Omit<Document, 'id'>>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Client, 'id'>>;
      };
      fournisseurs: {
        Row: Fournisseur;
        Insert: Omit<Fournisseur, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Fournisseur, 'id'>>;
      };
      team_members: {
        Row: TeamMember;
        Insert: Omit<TeamMember, 'id' | 'created_at'>;
        Update: Partial<Omit<TeamMember, 'id'>>;
      };
      field_reports: {
        Row: FieldReport;
        Insert: Omit<FieldReport, 'id' | 'created_at'>;
        Update: Partial<Omit<FieldReport, 'id'>>;
      };
      seao_appels_offres: {
        Row: SEAOAppelOffre;
        Insert: Omit<SEAOAppelOffre, 'id' | 'created_at'>;
        Update: Partial<Omit<SEAOAppelOffre, 'id'>>;
      };
      ccq_taux_horaires: {
        Row: CCQTauxHoraire;
        Insert: Omit<CCQTauxHoraire, 'id'>;
        Update: Partial<Omit<CCQTauxHoraire, 'id'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id'>>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at'>;
        Update: Partial<Omit<Activity, 'id'>>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      project_status: 'draft' | 'active' | 'completed' | 'on_hold' | 'cancelled';
      invoice_status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
      secteur_ccq: 'residentiel' | 'institutionnel_commercial' | 'industriel' | 'genie_civil';
    };
  };
}

// Types des tables
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  address?: string;
  city?: string;
  region?: string;
  status: 'draft' | 'active' | 'completed' | 'on_hold' | 'cancelled';
  type?: string;
  sector?: string;
  budget?: number;
  budget_revised?: number;
  start_date?: string;
  end_date?: string;
  progress?: number;
  manager?: string;
  team_size?: number;
  created_at: string;
  updated_at: string;
}

export interface Takeoff {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description?: string;
  plan_url?: string;
  scale?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'validated';
  elements: TakeoffElement[];
  total_items?: number;
  total_area?: number;
  total_length?: number;
  created_at: string;
  updated_at: string;
}

export interface TakeoffElement {
  id: string;
  type: 'surface' | 'lineaire' | 'comptage' | 'volume';
  name: string;
  quantity: number;
  unit: string;
  unit_price?: number;
  total?: number;
  notes?: string;
  coordinates?: { x: number; y: number; width?: number; height?: number }[];
}

export interface Estimate {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  version?: number;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  sections: EstimateSection[];
  subtotal: number;
  contingency_percent?: number;
  contingency_amount?: number;
  profit_percent?: number;
  profit_amount?: number;
  taxes_tps?: number;
  taxes_tvq?: number;
  total: number;
  valid_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EstimateSection {
  id: string;
  name: string;
  items: EstimateItem[];
  subtotal: number;
}

export interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  notes?: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  user_id: string;
  invoice_number: string;
  client_id?: string;
  client_name: string;
  client_address?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  paid_date?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxes_tps: number;
  taxes_tvq: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Document {
  id: string;
  project_id?: string;
  user_id: string;
  name: string;
  type: 'plan' | 'contract' | 'invoice' | 'photo' | 'report' | 'other';
  file_path: string;
  file_size: number;
  mime_type: string;
  folder?: string;
  tags?: string[];
  version?: number;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  notes?: string;
  total_projects?: number;
  total_revenue?: number;
  created_at: string;
  updated_at: string;
}

export interface Fournisseur {
  id: string;
  user_id: string;
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  category: string;
  specialties?: string[];
  rating?: number;
  rbq_license?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  project_id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  hourly_rate?: number;
  ccq_trade?: string;
  status: 'active' | 'inactive';
  avatar_url?: string;
  created_at: string;
}

export interface FieldReport {
  id: string;
  project_id: string;
  user_id: string;
  date: string;
  weather?: string;
  temperature?: number;
  workers_count?: number;
  work_performed: string;
  materials_used?: string;
  equipment_used?: string;
  visitors?: string;
  safety_issues?: string;
  delays?: string;
  photos?: string[];
  signature?: string;
  created_at: string;
}

export interface SEAOAppelOffre {
  id: string;
  numero_seao: string;
  titre: string;
  organisme: string;
  type: 'construction' | 'services' | 'approvisionnement';
  categorie: string;
  region: string;
  date_publication: string;
  date_ouverture?: string;
  date_fermeture: string;
  estimation_budget?: number;
  description?: string;
  statut: 'ouvert' | 'ferme' | 'annule' | 'attribue';
  url_seao: string;
  created_at: string;
  updated_at?: string;
}

export interface CCQTauxHoraire {
  id: string;
  code_metier: string;
  metier: string;
  secteur: 'residentiel' | 'institutionnel_commercial' | 'industriel' | 'genie_civil';
  classe: 'compagnon' | 'apprenti_1' | 'apprenti_2' | 'apprenti_3' | 'occupation';
  taux_base: number;
  vacances: number;
  conges_payes: number;
  avantages_sociaux: number;
  assurances: number;
  retraite: number;
  formation: number;
  taux_total: number;
  date_effective: string;
  date_fin?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  project_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

// Type helper pour les queries
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
