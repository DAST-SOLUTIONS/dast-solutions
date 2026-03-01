// src/pages/PrixUpdater/PrixUpdaterModule.tsx
// DAST Solutions - Module de mise à jour des prix
// Import CSV, mise à jour en lot, historique

import { useState, useRef } from 'react';
import { RefreshCw, Upload, Check, AlertCircle, ExternalLink, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface PriceUpdate {
  code: string;
  name?: string;
  price_material?: number;
  price_labor?: number;
  price_equipment?: number;
  supplier_price?: number;
  source?: string;
}

interface PreviewRow extends PriceUpdate {
  currentPrice?: number;
  found: boolean;
  itemId?: string;
}

const P = {
  bg: '#0c111d', surface: '#141b2d', surfaceAlt: '#1a2540',
  accent: '#14b8a6', accentAlt: '#f59e0b',
  danger: '#ef4444', success: '#22c55e', blue: '#3b82f6',
  text: '#e2e8f0', dim: '#64748b', border: '#1e293b',
};

const SUPPLIER_LINKS = [
  { name: 'Rona', url: 'https://www.rona.ca', tip: 'Matériaux de construction généraux' },
  { name: 'Lowes', url: 'https://www.lowes.ca', tip: 'Matériaux résidentiels et commerciaux' },
  { name: 'Réno-Dépôt', url: 'https://www.renodepot.com', tip: 'Grande surface' },
  { name: 'Canac', url: 'https://www.canac.ca', tip: 'Québec seulement — souvent moins cher' },
  { name: 'Patrick Morin', url: 'https://www.patrickmorin.com', tip: 'Régional Quebec' },
  { name: 'Manugypse', url: 'https://www.manugypse.com', tip: 'Gypse, cloisons, plafonds' },
  { name: 'BMR', url: 'https://www.bmr.qc.ca', tip: 'Coopérative québécoise' },
  { name: 'Matério', url: 'https://www.materio.com', tip: 'Matériaux innovants' },
  { name: 'Pont Masson', url: 'https://www.pontmasson.com', tip: 'Bois et matériaux structuraux' },
  { name: 'Home Dépôt', url: 'https://www.homedepot.ca', tip: 'Grand format américain' },
];

export default function PriceUpdater() {
  const [activeTab, setActiveTab] = useState<'manual' | 'import' | 'suppliers'>('manual');
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<{ id: string; code: string; name: string; price_material: number; price_labor: number; price_total: number } | null>(null);
  const [newPrice, setNewPrice] = useState({ material: '', labor: '', equipment: '' });
  const [updateReason, setUpdateReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [importPreview, setImportPreview] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Manual single-item update ──
  const searchItem = async () => {
    if (!searchCode.trim()) return;
    const { data } = await supabase
      .from('cost_items')
      .select('id, code, name, price_material, price_labor, price_equipment, price_total')
      .ilike('code', `%${searchCode.trim()}%`)
      .limit(1)
      .single();
    setSearchResult(data);
    if (!data) toast.error('Item non trouvé — vérifiez le code');
    else {
      setNewPrice({
        material: data.price_material.toString(),
        labor: data.price_labor.toString(),
        equipment: (data as { price_equipment?: number }).price_equipment?.toString() ?? '0',
      });
    }
  };

  const applyUpdate = async () => {
    if (!searchResult) return;
    setUpdating(true);
    try {
      const updates: Record<string, number | string> = {
        last_price_update: new Date().toISOString(),
      };
      if (newPrice.material !== '') updates.price_material = parseFloat(newPrice.material) || 0;
      if (newPrice.labor !== '') updates.price_labor = parseFloat(newPrice.labor) || 0;
      if (newPrice.equipment !== '') updates.price_equipment = parseFloat(newPrice.equipment) || 0;

      // Save history
      await supabase.from('cost_price_history').insert({
        item_id: searchResult.id,
        price_material_old: searchResult.price_material,
        price_material_new: parseFloat(newPrice.material) || searchResult.price_material,
        price_labor_old: searchResult.price_labor,
        price_labor_new: parseFloat(newPrice.labor) || searchResult.price_labor,
        change_reason: updateReason || 'Mise à jour manuelle',
      });

      await supabase.from('cost_items').update(updates).eq('id', searchResult.id);
      toast.success(`Prix mis à jour — ${searchResult.name}`);
      setSearchResult(null);
      setSearchCode('');
      setUpdateReason('');
    } catch {
      toast.error('Erreur mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  // ── CSV/Excel import ──
  const handleFileImport = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<PriceUpdate>(ws);

      // Match against DB
      const codes = rows.map(r => r.code).filter(Boolean);
      const { data: existingItems } = await supabase
        .from('cost_items')
        .select('id, code, price_material, price_total')
        .in('code', codes);

      const itemMap = new Map((existingItems ?? []).map(i => [i.code, i]));

      const preview: PreviewRow[] = rows.map(row => {
        const existing = row.code ? itemMap.get(row.code) : null;
        return {
          ...row,
          found: !!existing,
          itemId: existing?.id,
          currentPrice: existing?.price_material,
        };
      });

      setImportPreview(preview);
    } catch {
      toast.error('Erreur lecture fichier');
    }
  };

  const applyImport = async () => {
    setImporting(true);
    let updated = 0;
    let notFound = 0;

    try {
      for (const row of importPreview) {
        if (!row.found || !row.itemId) { notFound++; continue; }

        await supabase.from('cost_items').update({
          price_material: row.price_material ?? undefined,
          price_labor: row.price_labor ?? undefined,
          price_equipment: row.price_equipment ?? undefined,
          last_price_update: new Date().toISOString(),
        }).eq('id', row.itemId);

        await supabase.from('cost_price_history').insert({
          item_id: row.itemId,
          price_material_old: row.currentPrice,
          price_material_new: row.price_material,
          change_reason: row.source ? `Import: ${row.source}` : 'Import CSV',
        });

        updated++;
      }

      toast.success(`${updated} prix mis à jour · ${notFound} non trouvés`);
      setImportPreview([]);
    } catch {
      toast.error('Erreur import');
    } finally {
      setImporting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    background: P.surfaceAlt, border: `1px solid ${P.border}`,
    color: P.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ background: P.bg, minHeight: '100vh', padding: 24, color: P.text, fontFamily: '"SF Pro Display", -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>💰 Mise à jour des prix</h1>
        <p style={{ color: P.dim, fontSize: 14, marginBottom: 24 }}>
          Mettez à jour les prix unitaires — manuellement, par import CSV/Excel, ou via les fournisseurs.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: P.surface, borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {[
            { id: 'manual', label: '✏️ Manuel' },
            { id: 'import', label: '📤 Import CSV/Excel' },
            { id: 'suppliers', label: '🔗 Fournisseurs' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} style={{
              padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: activeTab === tab.id ? P.accent : 'transparent',
              color: activeTab === tab.id ? '#fff' : P.dim,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* MANUAL TAB */}
        {activeTab === 'manual' && (
          <div style={{ background: P.surface, borderRadius: 12, padding: 20, border: `1px solid ${P.border}` }}>
            <h3 style={{ margin: '0 0 16px', color: P.text }}>Rechercher un item par code</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input style={inputStyle} value={searchCode} onChange={e => setSearchCode(e.target.value)}
                placeholder="Code item (ex: BET-01-002)" onKeyDown={e => e.key === 'Enter' && searchItem()} />
              <button onClick={searchItem} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: P.accent, cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              }}>Rechercher</button>
            </div>

            {searchResult && (
              <div style={{ background: P.surfaceAlt, borderRadius: 10, padding: 16, border: `1px solid ${P.accent}40` }}>
                <div style={{ fontWeight: 700, color: P.text, marginBottom: 12 }}>
                  {searchResult.name} <span style={{ color: P.dim, fontWeight: 400, fontSize: 12 }}>#{searchResult.code}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Prix matériaux actuel', current: searchResult.price_material, key: 'material', color: P.accent },
                    { label: 'Prix M-O actuel', current: searchResult.price_labor, key: 'labor', color: P.accentAlt },
                    { label: 'Prix équipement actuel', current: (searchResult as { price_equipment?: number }).price_equipment ?? 0, key: 'equipment', color: P.blue },
                  ].map(({ label, current, key, color }) => (
                    <div key={key}>
                      <div style={{ fontSize: 11, color: P.dim, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 13, color, fontWeight: 600, marginBottom: 4 }}>
                        Actuel: {current.toFixed(4)} $
                      </div>
                      <input
                        type="number" step="0.0001"
                        style={inputStyle}
                        value={newPrice[key as keyof typeof newPrice]}
                        onChange={e => setNewPrice(p => ({ ...p, [key]: e.target.value }))}
                        placeholder="Nouveau prix"
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: P.dim, display: 'block', marginBottom: 4 }}>Raison de la mise à jour</label>
                  <input style={inputStyle} value={updateReason} onChange={e => setUpdateReason(e.target.value)}
                    placeholder="ex: Mise à jour Rona Mars 2026" />
                </div>

                <button onClick={applyUpdate} disabled={updating} style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: P.success, cursor: 'pointer', color: '#fff', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {updating ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                  {updating ? 'Mise à jour...' : 'Appliquer'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* IMPORT TAB */}
        {activeTab === 'import' && (
          <div style={{ background: P.surface, borderRadius: 12, padding: 20, border: `1px solid ${P.border}` }}>
            <h3 style={{ margin: '0 0 8px', color: P.text }}>Import CSV ou Excel</h3>
            <p style={{ color: P.dim, fontSize: 13, marginBottom: 16 }}>
              Le fichier doit avoir les colonnes: <code style={{ color: P.accent }}>code</code>, <code style={{ color: P.accent }}>price_material</code>, <code style={{ color: P.accent }}>price_labor</code> (optionnel), <code style={{ color: P.accent }}>source</code> (optionnel)
            </p>

            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFileImport(e.target.files[0])} />
            <button onClick={() => fileRef.current?.click()} style={{
              padding: '12px 24px', borderRadius: 8, border: `1px dashed ${P.border}`,
              background: 'none', cursor: 'pointer', color: P.dim, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            }}>
              <Upload size={16} /> Choisir fichier CSV / Excel
            </button>

            {importPreview.length > 0 && (
              <>
                <div style={{ marginBottom: 12, display: 'flex', gap: 12, fontSize: 13 }}>
                  <span style={{ color: P.success }}>✅ {importPreview.filter(r => r.found).length} trouvés</span>
                  <span style={{ color: P.danger }}>⚠️ {importPreview.filter(r => !r.found).length} non trouvés</span>
                </div>

                <div style={{ maxHeight: 300, overflowY: 'auto', borderRadius: 8, border: `1px solid ${P.border}`, marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: P.surfaceAlt }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: P.dim }}>Code</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', color: P.dim }}>Prix actuel</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', color: P.dim }}>Nouveau prix</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: P.dim }}>Source</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: P.dim }}>État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${P.border}` }}>
                          <td style={{ padding: '6px 12px', color: P.text }}>{row.code}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right', color: P.dim }}>{row.currentPrice?.toFixed(2) ?? '-'} $</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right', color: P.accent }}>{row.price_material?.toFixed(2) ?? '-'} $</td>
                          <td style={{ padding: '6px 12px', color: P.dim }}>{row.source ?? '-'}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                            {row.found
                              ? <span style={{ color: P.success }}>✅</span>
                              : <span style={{ color: P.danger }}>❌ Inconnu</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button onClick={applyImport} disabled={importing} style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: P.success, cursor: 'pointer', color: '#fff', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {importing ? <RefreshCw size={14} /> : <Check size={14} />}
                  {importing ? 'Import en cours...' : `Appliquer ${importPreview.filter(r => r.found).length} mises à jour`}
                </button>
              </>
            )}
          </div>
        )}

        {/* SUPPLIERS TAB */}
        {activeTab === 'suppliers' && (
          <div style={{ background: P.surface, borderRadius: 12, padding: 20, border: `1px solid ${P.border}` }}>
            <h3 style={{ margin: '0 0 8px', color: P.text }}>🔗 Liens fournisseurs Quebec</h3>
            <p style={{ color: P.dim, fontSize: 13, marginBottom: 16 }}>
              Comparez les prix en ligne et utilisez l'onglet "Import" pour mettre à jour en lot.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {SUPPLIER_LINKS.map(sup => (
                <a key={sup.name} href={sup.url} target="_blank" rel="noreferrer" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: P.surfaceAlt,
                  border: `1px solid ${P.border}`, borderRadius: 10,
                  textDecoration: 'none', transition: 'border-color 0.2s',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: P.text, fontSize: 14 }}>{sup.name}</div>
                    <div style={{ fontSize: 11, color: P.dim }}>{sup.tip}</div>
                  </div>
                  <ExternalLink size={14} color={P.accent} />
                </a>
              ))}
            </div>

            <div style={{
              marginTop: 16, padding: 12, background: `${P.accentAlt}10`,
              border: `1px solid ${P.accentAlt}30`, borderRadius: 8, fontSize: 12, color: P.dim,
            }}>
              <AlertCircle size={14} color={P.accentAlt} style={{ display: 'inline', marginRight: 6 }} />
              <strong style={{ color: P.accentAlt }}>Astuce:</strong> Exportez votre liste d'items en CSV (bouton ci-dessous), 
              comparez les prix sur le site du fournisseur, puis re-importez le fichier mis à jour.
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
