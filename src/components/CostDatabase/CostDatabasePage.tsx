// src/components/CostDatabase/CostDatabasePage.tsx
// DAST Solutions - Module Base de Données Coûts (type BIM)
// Sprint 1 - Fonctionnalité complète

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import {
  Package, Search, Plus, Edit3, Trash2, Image, FileText,
  ChevronDown, ChevronRight, Link, Upload, X, Check,
  RefreshCw, BarChart2, Layers, DollarSign, AlertCircle, Eye
} from 'lucide-react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface CostItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  category_code?: string;
  csc_division?: string;
  unit: string;
  unit_label?: string;
  price_material: number;
  price_labor: number;
  price_equipment: number;
  price_total: number;
  supplier_id?: string;
  supplier_sku?: string;
  supplier_url?: string;
  supplier_price?: number;
  image_url?: string;
  thumbnail_url?: string;
  technical_sheet_url?: string;
  technical_sheet_name?: string;
  specifications?: Record<string, unknown>;
  brand?: string;
  model?: string;
  standard?: string;
  notes?: string;
  is_active: boolean;
  is_custom: boolean;
  last_price_update?: string;
  // Joined
  supplier?: { name: string; website?: string };
  equivalents?: CostItem[];
}

interface CostAssembly {
  id: string;
  name: string;
  code?: string;
  description?: string;
  assembly_type?: string;
  category_code?: string;
  unit: string;
  image_url?: string;
  specifications?: Record<string, unknown>;
  is_active: boolean;
  items?: AssemblyItem[];
}

interface AssemblyItem {
  id: string;
  assembly_id: string;
  item_id: string;
  quantity: number;
  unit?: string;
  waste_factor: number;
  sort_order: number;
  item?: CostItem;
}

interface CostCategory {
  code: string;
  name: string;
  color: string;
  level: number;
}

// ─────────────────────────────────────────────
// PALLETE
// ─────────────────────────────────────────────
const P = {
  bg: '#0c111d',
  surface: '#141b2d',
  surfaceAlt: '#1a2540',
  accent: '#14b8a6',
  accentAlt: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  text: '#e2e8f0',
  dim: '#64748b',
  border: '#1e293b',
};

const CSC_COLORS: Record<string, string> = {
  '00': '#64748b', '01': '#64748b', '02': '#64748b',
  '03': '#78716c', '04': '#92400e', '05': '#374151',
  '06': '#14532d', '07': '#1e3a5f', '08': '#312e81',
  '09': '#4c1d95', '10': '#701a75', '22': '#164e63',
  '23': '#1e3a5f', '26': '#713f12', '31': '#78716c',
};

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────
const Badge = ({ children, color = P.accent }: { children: React.ReactNode; color?: string }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
    borderRadius: 12, fontSize: 11, fontWeight: 600,
    background: `${color}20`, color,
  }}>{children}</span>
);

const UnitLabel: Record<string, string> = {
  'U': 'Unité', 'M': 'M lin.', 'M2': 'M²', 'M3': 'M³',
  'PI': 'Pi lin.', 'PI2': 'Pi²', 'PI3': 'Pi³', 'LF': 'Pi lin.',
  'KG': 'kg', 'T': 'Tonne', 'HR': 'Heure', 'JR': 'Jour',
  'SAC': 'Sac', 'BOX': 'Boîte', 'RLX': 'Rouleau', 'SF': 'Pi²',
};

// ─────────────────────────────────────────────
// ITEM CARD
// ─────────────────────────────────────────────
const ItemCard = ({
  item, onEdit, onDelete, onSelect, isSelected,
  showEquivalents, onShowEquivalents
}: {
  item: CostItem;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
  showEquivalents: boolean;
  onShowEquivalents: () => void;
}) => {
  const divColor = CSC_COLORS[item.csc_division ?? '01'] ?? P.accent;

  return (
    <div
      style={{
        background: isSelected ? `${P.accent}10` : P.surface,
        border: `1px solid ${isSelected ? P.accent : P.border}`,
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={onSelect}
    >
      {/* Division color bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
        background: divColor,
        borderRadius: '12px 0 0 12px',
      }} />

      <div style={{ paddingLeft: 8 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
          {/* Thumbnail */}
          <div style={{
            width: 48, height: 48, borderRadius: 8, flexShrink: 0,
            background: item.image_url ? 'transparent' : `${divColor}20`,
            border: `1px solid ${P.border}`,
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {item.image_url
              ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Package size={20} color={divColor} />
            }
          </div>

          {/* Name & code */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: P.text, lineHeight: 1.3 }}>{item.name}</div>
            <div style={{ fontSize: 11, color: P.dim, marginTop: 2 }}>
              {item.code && <span style={{ marginRight: 8 }}>#{item.code}</span>}
              <Badge color={divColor}>Div. {item.csc_division ?? '?'}</Badge>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            {item.technical_sheet_url && (
              <button
                title="Fiche technique"
                onClick={() => window.open(item.technical_sheet_url, '_blank')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: P.blue }}
              >
                <FileText size={14} />
              </button>
            )}
            <button
              title="Modifier"
              onClick={onEdit}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: P.accentAlt }}
            >
              <Edit3 size={14} />
            </button>
            <button
              title="Supprimer"
              onClick={onDelete}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: P.danger }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Prices */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
          marginBottom: 8,
        }}>
          {[
            { label: 'Mat.', value: item.price_material, color: P.accent },
            { label: 'M.O.', value: item.price_labor, color: P.accentAlt },
            { label: 'Équip.', value: item.price_equipment, color: P.blue },
            { label: 'Total', value: item.price_total, color: P.text },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: P.surfaceAlt, borderRadius: 6, padding: '4px 6px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, color: P.dim, textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color }}>
                {value > 0 ? `${value.toFixed(2)}$` : '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Unit + supplier */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: P.dim }}>
            /{UnitLabel[item.unit] ?? item.unit}
            {item.supplier && <span style={{ marginLeft: 8, color: P.blue }}>• {item.supplier.name}</span>}
          </span>

          {/* Equivalents button */}
          {item.equivalents && item.equivalents.length > 0 && (
            <button
              onClick={e => { e.stopPropagation(); onShowEquivalents(); }}
              style={{
                background: showEquivalents ? `${P.purple}20` : 'none',
                border: `1px solid ${showEquivalents ? P.purple : P.border}`,
                borderRadius: 6, padding: '2px 8px',
                cursor: 'pointer', color: P.purple, fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <ChevronDown size={10} style={{ transform: showEquivalents ? 'rotate(180deg)' : 'none' }} />
              {item.equivalents.length} équivalent{item.equivalents.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Equivalents list */}
        {showEquivalents && item.equivalents && item.equivalents.length > 0 && (
          <div style={{
            marginTop: 8, padding: 8, background: `${P.purple}08`,
            border: `1px solid ${P.purple}30`, borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, color: P.purple, fontWeight: 600, marginBottom: 4 }}>
              ↔ Produits équivalents
            </div>
            {item.equivalents.map(eq => (
              <div key={eq.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 0', borderBottom: `1px solid ${P.border}`,
                fontSize: 12, color: P.text,
              }}>
                <span>{eq.name}</span>
                <span style={{ color: P.accent }}>{eq.price_total.toFixed(2)}$ /{eq.unit}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ITEM FORM MODAL
// ─────────────────────────────────────────────
const ItemModal = ({
  item, categories, suppliers, allItems, onClose, onSave
}: {
  item?: CostItem;
  categories: CostCategory[];
  suppliers: { id: string; name: string }[];
  allItems: CostItem[];
  onClose: () => void;
  onSave: (data: Partial<CostItem>, equivalentIds: string[]) => Promise<void>;
}) => {
  const [form, setForm] = useState<Partial<CostItem>>(item ?? {
    unit: 'U', price_material: 0, price_labor: 0, price_equipment: 0,
    is_active: true, is_custom: true,
  });
  const [selectedEquivalents, setSelectedEquivalents] = useState<string[]>(
    item?.equivalents?.map(e => e.id) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingSheet, setUploadingSheet] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLInputElement>(null);

  const f = (key: keyof CostItem, val: unknown) => setForm(p => ({ ...p, [key]: val }));

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `cost-items/images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('dast-assets').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('dast-assets').getPublicUrl(path);
      f('image_url', data.publicUrl);
      toast.success('Image uploadée');
    } catch (e) {
      toast.error('Erreur upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSheetUpload = async (file: File) => {
    setUploadingSheet(true);
    try {
      const path = `cost-items/sheets/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('dast-assets').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('dast-assets').getPublicUrl(path);
      f('technical_sheet_url', data.publicUrl);
      f('technical_sheet_name', file.name);
      toast.success('Fiche technique uploadée');
    } catch (e) {
      toast.error('Erreur upload fiche');
    } finally {
      setUploadingSheet(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Nom requis'); return; }
    setSaving(true);
    try {
      await onSave(form, selectedEquivalents);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    background: P.surfaceAlt, border: `1px solid ${P.border}`,
    color: P.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = { fontSize: 11, color: P.dim, marginBottom: 4, display: 'block', fontWeight: 600 };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: P.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 700,
        maxHeight: '90vh', overflowY: 'auto',
        border: `1px solid ${P.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: P.text, fontSize: 18, fontWeight: 700 }}>
            {item ? 'Modifier l\'item' : 'Nouvel item de coût'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.dim }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Name */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Nom de l'item *</label>
            <input style={inputStyle} value={form.name ?? ''} onChange={e => f('name', e.target.value)} placeholder="ex: Béton 25 MPa" />
          </div>

          {/* Code */}
          <div>
            <label style={labelStyle}>Code</label>
            <input style={inputStyle} value={form.code ?? ''} onChange={e => f('code', e.target.value)} placeholder="ex: BET-01-001" />
          </div>

          {/* Unit */}
          <div>
            <label style={labelStyle}>Unité</label>
            <select style={{ ...inputStyle }} value={form.unit ?? 'U'} onChange={e => f('unit', e.target.value)}>
              {Object.entries(UnitLabel).map(([val, lbl]) => (
                <option key={val} value={val}>{val} — {lbl}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Division CSC</label>
            <select style={{ ...inputStyle }} value={form.csc_division ?? ''} onChange={e => f('csc_division', e.target.value)}>
              <option value="">— Choisir —</option>
              {categories.filter(c => c.level === 1).map(c => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label style={labelStyle}>Fournisseur</label>
            <select style={{ ...inputStyle }} value={form.supplier_id ?? ''} onChange={e => f('supplier_id', e.target.value)}>
              <option value="">— Aucun —</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Prices */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ ...labelStyle, color: P.accent }}>💰 Prix unitaires</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Matériaux ($)', key: 'price_material', color: P.accent },
                { label: 'Main-d\'œuvre ($)', key: 'price_labor', color: P.accentAlt },
                { label: 'Équipement ($)', key: 'price_equipment', color: P.blue },
              ].map(({ label, key, color }) => (
                <div key={key}>
                  <label style={{ ...labelStyle, color }}>{label}</label>
                  <input
                    type="number" step="0.01" style={inputStyle}
                    value={(form[key as keyof CostItem] as number) ?? 0}
                    onChange={e => f(key as keyof CostItem, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Total preview */}
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '8px', background: P.surfaceAlt, borderRadius: 8 }}>
            <span style={{ color: P.dim, fontSize: 12 }}>Total unitaire: </span>
            <span style={{ color: P.text, fontWeight: 700, fontSize: 16 }}>
              {((form.price_material ?? 0) + (form.price_labor ?? 0) + (form.price_equipment ?? 0)).toFixed(2)} $
            </span>
            <span style={{ color: P.dim, fontSize: 12 }}> /{form.unit}</span>
          </div>

          {/* Image upload */}
          <div>
            <label style={{ ...labelStyle, color: P.accent }}>📷 Image du produit</label>
            <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
            {form.image_url ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={form.image_url} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: `1px solid ${P.border}` }} />
                <button onClick={() => f('image_url', null)}
                  style={{ position: 'absolute', top: -6, right: -6, background: P.danger, border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button onClick={() => imageRef.current?.click()} disabled={uploadingImage}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: `1px dashed ${P.border}`,
                  background: 'none', cursor: 'pointer', color: P.dim, fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {uploadingImage ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                {uploadingImage ? 'Upload...' : 'Choisir image'}
              </button>
            )}
          </div>

          {/* Technical sheet upload */}
          <div>
            <label style={{ ...labelStyle, color: P.blue }}>📄 Fiche technique (PDF)</label>
            <input ref={sheetRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleSheetUpload(e.target.files[0])} />
            {form.technical_sheet_url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a href={form.technical_sheet_url} target="_blank" rel="noreferrer"
                  style={{ color: P.blue, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileText size={14} /> {form.technical_sheet_name ?? 'Voir fiche'}
                </a>
                <button onClick={() => { f('technical_sheet_url', null); f('technical_sheet_name', null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.danger }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button onClick={() => sheetRef.current?.click()} disabled={uploadingSheet}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: `1px dashed ${P.border}`,
                  background: 'none', cursor: 'pointer', color: P.dim, fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {uploadingSheet ? <RefreshCw size={14} /> : <Upload size={14} />}
                {uploadingSheet ? 'Upload...' : 'Choisir PDF'}
              </button>
            )}
          </div>

          {/* Supplier URL */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Lien fournisseur (URL produit)</label>
            <input style={inputStyle} value={form.supplier_url ?? ''} onChange={e => f('supplier_url', e.target.value)} placeholder="https://www.rona.ca/..." />
          </div>

          {/* Notes */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.notes ?? ''} onChange={e => f('notes', e.target.value)} />
          </div>

          {/* Equivalents */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ ...labelStyle, color: P.purple }}>↔ Produits équivalents</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {selectedEquivalents.map(eqId => {
                const eq = allItems.find(i => i.id === eqId);
                return eq ? (
                  <div key={eqId} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: `${P.purple}15`, border: `1px solid ${P.purple}40`,
                    borderRadius: 20, padding: '2px 10px', fontSize: 12, color: P.text,
                  }}>
                    {eq.name}
                    <button onClick={() => setSelectedEquivalents(p => p.filter(x => x !== eqId))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.purple, padding: 0 }}>
                      <X size={10} />
                    </button>
                  </div>
                ) : null;
              })}
            </div>
            <select style={inputStyle}
              onChange={e => {
                const val = e.target.value;
                if (val && !selectedEquivalents.includes(val))
                  setSelectedEquivalents(p => [...p, val]);
                e.target.value = '';
              }}>
              <option value="">+ Ajouter un équivalent...</option>
              {allItems
                .filter(i => i.id !== item?.id && !selectedEquivalents.includes(i.id))
                .map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', borderRadius: 8, border: `1px solid ${P.border}`,
            background: 'none', cursor: 'pointer', color: P.dim, fontSize: 13,
          }}>Annuler</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: saving ? P.dim : P.accent, cursor: saving ? 'not-allowed' : 'pointer',
            color: '#fff', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ASSEMBLY MODAL
// ─────────────────────────────────────────────
const AssemblyModal = ({
  assembly, allItems, onClose, onSave
}: {
  assembly?: CostAssembly;
  allItems: CostItem[];
  onClose: () => void;
  onSave: (data: Partial<CostAssembly>, items: Partial<AssemblyItem>[]) => Promise<void>;
}) => {
  const [form, setForm] = useState<Partial<CostAssembly>>(assembly ?? {
    unit: 'M2', is_active: true,
  });
  const [assemblyItems, setAssemblyItems] = useState<Partial<AssemblyItem>[]>(
    assembly?.items ?? []
  );
  const [saving, setSaving] = useState(false);

  const f = (key: keyof CostAssembly, val: unknown) => setForm(p => ({ ...p, [key]: val }));

  const addItem = (itemId: string) => {
    if (!itemId) return;
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    setAssemblyItems(p => [...p, {
      item_id: itemId, quantity: 1, waste_factor: 1.0,
      unit: item.unit, sort_order: p.length, item,
    }]);
  };

  const totalCost = assemblyItems.reduce((sum, ai) => {
    const item = allItems.find(i => i.id === ai.item_id);
    return sum + (item?.price_total ?? 0) * (ai.quantity ?? 1) * (ai.waste_factor ?? 1);
  }, 0);

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Nom requis'); return; }
    setSaving(true);
    try {
      await onSave(form, assemblyItems);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    background: P.surfaceAlt, border: `1px solid ${P.border}`,
    color: P.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: P.dim, marginBottom: 4, display: 'block', fontWeight: 600 };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: P.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 800,
        maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${P.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: P.text, fontSize: 18, fontWeight: 700 }}>
            {assembly ? 'Modifier l\'assemblage' : 'Nouvel assemblage / famille'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.dim }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Nom de l'assemblage *</label>
            <input style={inputStyle} value={form.name ?? ''} onChange={e => f('name', e.target.value)} placeholder="ex: Mur extérieur 2x6 R-24" />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.assembly_type ?? 'custom'} onChange={e => f('assembly_type', e.target.value)}>
              <option value="wall">Mur / Wall</option>
              <option value="floor">Plancher / Floor</option>
              <option value="ceiling">Plafond / Ceiling</option>
              <option value="column">Colonne / Column</option>
              <option value="beam">Poutre / Beam</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Unité de base</label>
            <select style={inputStyle} value={form.unit ?? 'M2'} onChange={e => f('unit', e.target.value)}>
              {Object.entries(UnitLabel).map(([val, lbl]) => (
                <option key={val} value={val}>{val} — {lbl}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.description ?? ''} onChange={e => f('description', e.target.value)} />
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...labelStyle, color: P.accentAlt }}>📦 Composantes de l'assemblage</label>
            <span style={{ fontSize: 12, color: P.accent, fontWeight: 700 }}>
              Total: {totalCost.toFixed(2)} $ /{form.unit}
            </span>
          </div>

          {/* Add item */}
          <select style={inputStyle}
            onChange={e => { addItem(e.target.value); e.target.value = ''; }}>
            <option value="">+ Ajouter un item...</option>
            {allItems.map(i => (
              <option key={i.id} value={i.id}>{i.name} ({i.unit}) — {i.price_total.toFixed(2)}$</option>
            ))}
          </select>

          {/* Items list */}
          {assemblyItems.length > 0 && (
            <div style={{ marginTop: 8, background: P.surfaceAlt, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 80px 70px 80px 30px',
                gap: 8, padding: '6px 12px',
                fontSize: 10, color: P.dim, fontWeight: 700, textTransform: 'uppercase',
              }}>
                <span>Item</span><span>Qté</span><span>Perte %</span><span>Sous-total</span><span></span>
              </div>
              {assemblyItems.map((ai, idx) => {
                const item = allItems.find(i => i.id === ai.item_id);
                const subtotal = (item?.price_total ?? 0) * (ai.quantity ?? 1) * (ai.waste_factor ?? 1);
                return (
                  <div key={idx} style={{
                    display: 'grid', gridTemplateColumns: '2fr 80px 70px 80px 30px',
                    gap: 8, padding: '8px 12px', borderTop: `1px solid ${P.border}`,
                    alignItems: 'center', fontSize: 12,
                  }}>
                    <span style={{ color: P.text }}>{item?.name ?? '?'}</span>
                    <input
                      type="number" step="0.01" value={ai.quantity ?? 1}
                      onChange={e => setAssemblyItems(p => {
                        const n = [...p]; n[idx] = { ...n[idx], quantity: parseFloat(e.target.value) || 1 }; return n;
                      })}
                      style={{ ...inputStyle, padding: '4px 6px', fontSize: 12 }}
                    />
                    <input
                      type="number" step="0.01" value={((ai.waste_factor ?? 1) - 1) * 100}
                      onChange={e => setAssemblyItems(p => {
                        const n = [...p]; n[idx] = { ...n[idx], waste_factor: 1 + (parseFloat(e.target.value) || 0) / 100 }; return n;
                      })}
                      style={{ ...inputStyle, padding: '4px 6px', fontSize: 12 }}
                    />
                    <span style={{ color: P.accent, fontWeight: 600 }}>{subtotal.toFixed(2)} $</span>
                    <button onClick={() => setAssemblyItems(p => p.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.danger }}>
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', borderRadius: 8, border: `1px solid ${P.border}`,
            background: 'none', cursor: 'pointer', color: P.dim, fontSize: 13,
          }}>Annuler</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: P.accentAlt, cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {saving ? <RefreshCw size={14} /> : <Check size={14} />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function CostDatabasePage() {
  const [activeTab, setActiveTab] = useState<'items' | 'assemblies'>('items');
  const [items, setItems] = useState<CostItem[]>([]);
  const [assemblies, setAssemblies] = useState<CostAssembly[]>([]);
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDiv, setFilterDiv] = useState('');
  const [editingItem, setEditingItem] = useState<CostItem | undefined>();
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState<CostAssembly | undefined>();
  const [showAssemblyModal, setShowAssemblyModal] = useState(false);
  const [expandedEquivalents, setExpandedEquivalents] = useState<Set<string>>(new Set());

  // ── Load data ──
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cost_items')
        .select(`
          *,
          supplier:cost_suppliers(name, website),
          equivalents:cost_item_equivalents!item_id(
            equivalent:cost_items!equivalent_item_id(*)
          )
        `)
        .eq('is_active', true)
        .order('csc_division', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      // Flatten equivalents
      const processed = (data ?? []).map((item: CostItem & { equivalents: { equivalent: CostItem }[] }) => ({
        ...item,
        equivalents: (item.equivalents ?? []).map((e: { equivalent: CostItem }) => e.equivalent),
      }));
      setItems(processed);
    } catch (e) {
      toast.error('Erreur chargement items');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAssemblies = useCallback(async () => {
    const { data, error } = await supabase
      .from('cost_assemblies')
      .select(`
        *,
        items:cost_assembly_items(
          *,
          item:cost_items(*)
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (!error) setAssemblies(data ?? []);
  }, []);

  const loadMeta = useCallback(async () => {
    const [{ data: cats }, { data: supps }] = await Promise.all([
      supabase.from('cost_categories').select('*').order('sort_order'),
      supabase.from('cost_suppliers').select('id, name').eq('is_active', true).order('name'),
    ]);
    setCategories(cats ?? []);
    setSuppliers(supps ?? []);
  }, []);

  useEffect(() => {
    loadMeta();
    loadItems();
    loadAssemblies();
  }, [loadMeta, loadItems, loadAssemblies]);

  // ── Save item ──
  const saveItem = async (data: Partial<CostItem>, equivalentIds: string[]) => {
    const { id, equivalents: _eq, supplier: _sup, ...payload } = data as CostItem & { equivalents?: CostItem[]; supplier?: { name: string } };

    if (id) {
      await supabase.from('cost_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
      // Update equivalents
      await supabase.from('cost_item_equivalents').delete().eq('item_id', id);
      if (equivalentIds.length > 0) {
        await supabase.from('cost_item_equivalents').insert(
          equivalentIds.map(eqId => ({ item_id: id, equivalent_item_id: eqId, similarity_pct: 100 }))
        );
      }
    } else {
      const { data: newItem, error } = await supabase.from('cost_items').insert(payload).select().single();
      if (error) throw error;
      if (equivalentIds.length > 0 && newItem) {
        await supabase.from('cost_item_equivalents').insert(
          equivalentIds.map(eqId => ({ item_id: newItem.id, equivalent_item_id: eqId, similarity_pct: 100 }))
        );
      }
    }

    toast.success(id ? 'Item modifié' : 'Item créé');
    await loadItems();
  };

  // ── Save assembly ──
  const saveAssembly = async (data: Partial<CostAssembly>, assemblyItems: Partial<AssemblyItem>[]) => {
    const { id, items: _items, ...payload } = data as CostAssembly & { items?: AssemblyItem[] };

    let assemblyId = id;
    if (id) {
      await supabase.from('cost_assemblies').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
      await supabase.from('cost_assembly_items').delete().eq('assembly_id', id);
    } else {
      const { data: newAsm, error } = await supabase.from('cost_assemblies').insert(payload).select().single();
      if (error) throw error;
      assemblyId = newAsm?.id;
    }

    if (assemblyId && assemblyItems.length > 0) {
      await supabase.from('cost_assembly_items').insert(
        assemblyItems.map((ai, idx) => ({
          assembly_id: assemblyId,
          item_id: ai.item_id,
          quantity: ai.quantity ?? 1,
          waste_factor: ai.waste_factor ?? 1,
          sort_order: idx,
        }))
      );
    }

    toast.success(id ? 'Assemblage modifié' : 'Assemblage créé');
    await loadAssemblies();
  };

  // ── Delete ──
  const deleteItem = async (id: string) => {
    if (!confirm('Supprimer cet item?')) return;
    await supabase.from('cost_items').update({ is_active: false }).eq('id', id);
    toast.success('Item supprimé');
    await loadItems();
  };

  // ── Filter ──
  const filteredItems = items.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.code?.toLowerCase().includes(q);
    const matchDiv = !filterDiv || item.csc_division === filterDiv;
    return matchSearch && matchDiv;
  });

  const divisions = [...new Set(items.map(i => i.csc_division).filter(Boolean))].sort() as string[];

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div style={{ background: P.bg, minHeight: '100vh', color: P.text, fontFamily: '"SF Pro Display", -apple-system, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: P.text }}>
              📦 Base de Données Coûts
            </h1>
            <p style={{ margin: '4px 0 0', color: P.dim, fontSize: 14 }}>
              {items.length} items · {assemblies.length} assemblages · Mise à jour des prix en temps réel
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setEditingItem(undefined); setShowAssemblyModal(true); }}
              style={{
                padding: '10px 16px', borderRadius: 8, border: `1px solid ${P.accentAlt}`,
                background: `${P.accentAlt}15`, cursor: 'pointer', color: P.accentAlt,
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <Layers size={14} /> Nouvel assemblage
            </button>
            <button
              onClick={() => { setEditingItem(undefined); setShowItemModal(true); }}
              style={{
                padding: '10px 16px', borderRadius: 8, border: 'none',
                background: P.accent, cursor: 'pointer', color: '#fff',
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <Plus size={14} /> Nouvel item
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 16,
          background: P.surface, borderRadius: 10, padding: 4,
          width: 'fit-content',
        }}>
          {[
            { id: 'items', label: `Items (${filteredItems.length})`, icon: <Package size={14} /> },
            { id: 'assemblies', label: `Assemblages (${assemblies.length})`, icon: <Layers size={14} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as 'items' | 'assemblies')} style={{
              padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              background: activeTab === tab.id ? P.accent : 'transparent',
              color: activeTab === tab.id ? '#fff' : P.dim,
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'items' && (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: P.dim }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un item, code..."
                  style={{
                    width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8,
                    background: P.surface, border: `1px solid ${P.border}`,
                    color: P.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <select value={filterDiv} onChange={e => setFilterDiv(e.target.value)} style={{
                padding: '8px 12px', borderRadius: 8, background: P.surface,
                border: `1px solid ${P.border}`, color: P.text, fontSize: 13, outline: 'none',
              }}>
                <option value="">Toutes divisions</option>
                {divisions.map(d => (
                  <option key={d} value={d}>Div. {d} - {categories.find(c => c.code === d)?.name ?? ''}</option>
                ))}
              </select>
            </div>

            {/* Items grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: P.dim }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <div>Chargement...</div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: P.dim }}>
                <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div>Aucun item trouvé</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                {filteredItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => { setEditingItem(item); setShowItemModal(true); }}
                    onDelete={() => deleteItem(item.id)}
                    onSelect={() => { }}
                    isSelected={false}
                    showEquivalents={expandedEquivalents.has(item.id)}
                    onShowEquivalents={() => setExpandedEquivalents(p => {
                      const n = new Set(p);
                      n.has(item.id) ? n.delete(item.id) : n.add(item.id);
                      return n;
                    })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'assemblies' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
            {assemblies.map(asm => {
              const totalCost = (asm.items ?? []).reduce((sum, ai) => {
                return sum + (ai.item?.price_total ?? 0) * ai.quantity * ai.waste_factor;
              }, 0);
              return (
                <div key={asm.id} style={{
                  background: P.surface, border: `1px solid ${P.border}`,
                  borderRadius: 12, padding: 16,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Layers size={16} color={P.accentAlt} />
                      <span style={{ fontWeight: 600, color: P.text }}>{asm.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditingAssembly(asm); setShowAssemblyModal(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.accentAlt }}>
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>
                  {asm.description && <p style={{ fontSize: 12, color: P.dim, margin: '0 0 8px' }}>{asm.description}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <Badge color={P.purple}>{asm.assembly_type ?? 'custom'}</Badge>
                    <span style={{ color: P.accent, fontWeight: 700 }}>
                      {totalCost.toFixed(2)} $ /{asm.unit}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: P.dim, marginTop: 6 }}>
                    {(asm.items ?? []).length} composante{(asm.items ?? []).length > 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}

            {assemblies.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: P.dim }}>
                <Layers size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div>Aucun assemblage — créez votre premier!</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showItemModal && (
        <ItemModal
          item={editingItem}
          categories={categories}
          suppliers={suppliers}
          allItems={items}
          onClose={() => { setShowItemModal(false); setEditingItem(undefined); }}
          onSave={saveItem}
        />
      )}

      {showAssemblyModal && (
        <AssemblyModal
          assembly={editingAssembly}
          allItems={items}
          onClose={() => { setShowAssemblyModal(false); setEditingAssembly(undefined); }}
          onSave={saveAssembly}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

