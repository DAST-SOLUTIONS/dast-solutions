/**
 * Dashboard Intégrations Québec
 * Interface unifiée pour RBQ, CCQ, Paie, Appels d'offres, Associations
 * Version: 14 janvier 2026
 */
import { useState, useEffect } from 'react';
import { 
  Shield, HardHat, DollarSign, Briefcase, Users, Building2,
  CheckCircle, XCircle, Clock, AlertTriangle, Search, 
  TrendingUp, Calendar, MapPin, ExternalLink, RefreshCw,
  FileText, Award, Phone, Mail, Globe, ChevronRight,
  Calculator, Wallet, Receipt, Download
} from 'lucide-react';

// Services
import { 
  rbqService, verifyRBQLicense, getRBQVerificationUrl,
  RBQ_CATEGORIES, RBQ_REGIONS,
  type RBQVerificationResult
} from '@/services/rbqService';
import { 
  ccqServiceEnhanced, 
  CCQ_TAUX_2025_2026, CCQ_METIERS, CCQ_SECTEURS 
} from '@/services/ccqServiceEnhanced';
import { 
  paieService, 
  TAUX_GOUVERNEMENT_2025 
} from '@/services/paieService';
import { 
  appelsOffresCanadaService,
  type AppelOffre 
} from '@/services/appelsOffresCanadaService';
import { 
  associationsService, 
  ASSOCIATIONS_QUEBEC 
} from '@/services/associationsService';

// ============ COMPOSANTS ============

// Widget RBQ
function RBQWidget() {
  const [licenseNumber, setLicenseNumber] = useState('');
  const [result, setResult] = useState<RBQVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!licenseNumber) return;
    setLoading(true);
    try {
      const res = await verifyRBQLicense(licenseNumber);
      setResult(res);
    } catch (error) {
      setResult({ success: false, error: 'Erreur de vérification' });
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Shield className="text-blue-600" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Vérification RBQ</h3>
          <p className="text-xs text-gray-500">Régie du bâtiment du Québec</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Numéro de licence (ex: 1234-5678-90)"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleVerify}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
          Vérifier
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          {result.success ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} />
                <span className="font-medium text-green-800">Licence valide</span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Entreprise:</strong> {result.data?.companyName}</p>
                <p><strong>Statut:</strong> {result.data?.status}</p>
                <p><strong>Expiration:</strong> {result.data?.expirationDate}</p>
                <p><strong>Catégories:</strong> {result.data?.categories?.join(', ')}</p>
              </div>
              {result.licenseNumber && (
                <a 
                  href={getRBQVerificationUrl(result.licenseNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                >
                  Voir sur RBQ <ExternalLink size={14} />
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <XCircle className="text-red-600" size={20} />
              <span className="font-medium text-red-800">{result.error || result.message || 'Licence non trouvée'}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500 mb-2">Catégories RBQ disponibles:</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(RBQ_CATEGORIES).slice(0, 6).map(([code, cat]) => (
            <span key={code} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {code}: {cat.nom.substring(0, 20)}...
            </span>
          ))}
          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
            +{Object.keys(RBQ_CATEGORIES).length - 6} autres
          </span>
        </div>
      </div>
    </div>
  );
}

// Widget CCQ Taux
function CCQTauxWidget() {
  const [selectedSecteur, setSelectedSecteur] = useState<string>('CI');
  const [selectedMetier, setSelectedMetier] = useState<string>('electricien');

  const taux = CCQ_TAUX_2025_2026[selectedSecteur as keyof typeof CCQ_TAUX_2025_2026]?.[selectedMetier];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
          <HardHat className="text-orange-600" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Taux CCQ 2025-2026</h3>
          <p className="text-xs text-gray-500">Commission de la construction du Québec</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <select
          value={selectedSecteur}
          onChange={(e) => setSelectedSecteur(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          {Object.entries(CCQ_SECTEURS).map(([code, nom]) => (
            <option key={code} value={code}>{code} - {nom}</option>
          ))}
        </select>
        <select
          value={selectedMetier}
          onChange={(e) => setSelectedMetier(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          {Object.entries(CCQ_METIERS).map(([code, metier]) => (
            <option key={code} value={code}>{metier.nom}</option>
          ))}
        </select>
      </div>

      {taux ? (
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Taux de base</p>
              <p className="text-2xl font-bold text-gray-900">{taux.taux_base.toFixed(2)}$/h</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Coût total employeur</p>
              <p className="text-2xl font-bold text-orange-600">{taux.cout_total_employeur.toFixed(2)}$/h</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white/70 rounded p-2">
              <p className="text-gray-500">Vacances 13%</p>
              <p className="font-medium">{taux.vacances.toFixed(2)}$</p>
            </div>
            <div className="bg-white/70 rounded p-2">
              <p className="text-gray-500">Avantages sociaux</p>
              <p className="font-medium">{taux.avantages_sociaux.toFixed(2)}$</p>
            </div>
            <div className="bg-white/70 rounded p-2">
              <p className="text-gray-500">Retraite</p>
              <p className="font-medium">{taux.regime_retraite.toFixed(2)}$</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Sélectionnez un secteur et un métier</p>
      )}

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">
          {Object.keys(CCQ_METIERS).length} métiers • 4 secteurs • Mise à jour 2025-2026
        </p>
      </div>
    </div>
  );
}

// Widget Calculatrice Paie
function PaieCalculatorWidget() {
  const [heures, setHeures] = useState(40);
  const [tauxHoraire, setTauxHoraire] = useState(50);
  const [result, setResult] = useState<any>(null);

  const calculer = () => {
    const salaireBrut = heures * tauxHoraire;
    const taux = TAUX_GOUVERNEMENT_2025;
    
    const rrq = salaireBrut * taux.rrq.taux_employe;
    const rqap = salaireBrut * taux.rqap.taux_employe;
    const ae = salaireBrut * taux.ae.taux_employe;
    
    // Impôt estimé (simplifié)
    const impotEstime = salaireBrut * 0.25;
    
    const totalDeductions = rrq + rqap + ae + impotEstime;
    const salaireNet = salaireBrut - totalDeductions;
    
    // Contributions employeur
    const rrqEmployeur = salaireBrut * taux.rrq.taux_employeur;
    const rqapEmployeur = salaireBrut * taux.rqap.taux_employeur;
    const aeEmployeur = salaireBrut * taux.ae.taux_employeur;
    const fss = salaireBrut * taux.fss.taux_base;
    const cnt = salaireBrut * taux.cnt.taux;
    
    const totalEmployeur = rrqEmployeur + rqapEmployeur + aeEmployeur + fss + cnt;
    
    setResult({
      salaireBrut,
      rrq, rqap, ae, impotEstime,
      totalDeductions,
      salaireNet,
      rrqEmployeur, rqapEmployeur, aeEmployeur, fss, cnt,
      totalEmployeur,
      coutTotal: salaireBrut + totalEmployeur
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
          <Calculator className="text-green-600" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Calculatrice Paie</h3>
          <p className="text-xs text-gray-500">DAS Québec 2025</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Heures/semaine</label>
          <input
            type="number"
            value={heures}
            onChange={(e) => setHeures(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Taux horaire ($)</label>
          <input
            type="number"
            value={tauxHoraire}
            onChange={(e) => setTauxHoraire(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      <button
        onClick={calculer}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2"
      >
        <Calculator size={16} />
        Calculer
      </button>

      {result && (
        <div className="mt-4 space-y-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Salaire brut</span>
              <span className="text-lg font-bold text-gray-900">{result.salaireBrut.toFixed(2)} $</span>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-red-700 mb-2">Déductions employé</p>
            <div className="flex justify-between text-xs">
              <span>RRQ ({(TAUX_GOUVERNEMENT_2025.rrq.taux_employe * 100).toFixed(2)}%)</span>
              <span>{result.rrq.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>RQAP ({(TAUX_GOUVERNEMENT_2025.rqap.taux_employe * 100).toFixed(3)}%)</span>
              <span>{result.rqap.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>AE ({(TAUX_GOUVERNEMENT_2025.ae.taux_employe * 100).toFixed(2)}%)</span>
              <span>{result.ae.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Impôts (estimé ~25%)</span>
              <span>{result.impotEstime.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-xs font-medium pt-1 border-t mt-1">
              <span>Total déductions</span>
              <span className="text-red-700">-{result.totalDeductions.toFixed(2)} $</span>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-700">Salaire net</span>
              <span className="text-lg font-bold text-green-700">{result.salaireNet.toFixed(2)} $</span>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-purple-700 mb-2">Contributions employeur</p>
            <div className="flex justify-between text-xs">
              <span>RRQ + RQAP + AE</span>
              <span>{(result.rrqEmployeur + result.rqapEmployeur + result.aeEmployeur).toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>FSS + CNT</span>
              <span>{(result.fss + result.cnt).toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-xs font-medium pt-1 border-t mt-1">
              <span>Coût total employeur</span>
              <span className="text-purple-700">{result.coutTotal.toFixed(2)} $</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Widget Appels d'offres
function AppelsOffresWidget() {
  const [appels, setAppels] = useState<AppelOffre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppels = async () => {
      try {
        const results = await appelsOffresCanadaService.rechercherToutesSources({
          province: 'QC',
          categories: ['construction'],
          statut: 'ouvert'
        });
        setAppels(results.slice(0, 5));
      } catch (error) {
        console.error('Erreur chargement appels:', error);
      }
      setLoading(false);
    };
    loadAppels();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Briefcase className="text-purple-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Appels d'offres</h3>
            <p className="text-xs text-gray-500">SEAO • MERX • BuyGC • Bonfire</p>
          </div>
        </div>
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
          Multi-sources
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin text-gray-400" size={24} />
        </div>
      ) : appels.length > 0 ? (
        <div className="space-y-3">
          {appels.map((appel) => (
            <div key={appel.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{appel.titre}</p>
                  <p className="text-xs text-gray-500">{appel.organisme}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  appel.source === 'seao' ? 'bg-blue-100 text-blue-700' :
                  appel.source === 'merx' ? 'bg-red-100 text-red-700' :
                  appel.source === 'buygc' ? 'bg-green-100 text-green-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {appel.source.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {appel.date_fermeture}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {appel.region || appel.province}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 text-sm py-4">Aucun appel d'offres trouvé</p>
      )}

      <div className="mt-4 pt-4 border-t flex justify-between items-center">
        <div className="flex gap-2">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">SEAO</span>
          <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">MERX</span>
          <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">BuyGC</span>
          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs">Bonfire</span>
        </div>
        <a href="/appels-offres" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
          Voir tout <ChevronRight size={14} />
        </a>
      </div>
    </div>
  );
}

// Widget Associations
function AssociationsWidget() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Toutes' },
    { id: 'employer', label: 'Patronales' },
    { id: 'estimating', label: 'Estimation' },
    { id: 'certification', label: 'Certifications' }
  ];

  const filteredAssociations = selectedCategory === 'all' 
    ? ASSOCIATIONS_QUEBEC 
    : ASSOCIATIONS_QUEBEC.filter(a => a.type === selectedCategory);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
          <Award className="text-teal-600" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Associations professionnelles</h3>
          <p className="text-xs text-gray-500">{ASSOCIATIONS_QUEBEC.length} associations québécoises</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === cat.id 
                ? 'bg-teal-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredAssociations.slice(0, 6).map((assoc) => (
          <div key={assoc.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{assoc.sigle}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{assoc.nom}</p>
              </div>
              <div className="flex gap-1">
                {assoc.telephone && (
                  <a href={`tel:${assoc.telephone}`} className="p-1.5 bg-white rounded hover:bg-blue-50">
                    <Phone size={14} className="text-blue-600" />
                  </a>
                )}
                {assoc.site_web && (
                  <a href={assoc.site_web} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white rounded hover:bg-blue-50">
                    <Globe size={14} className="text-blue-600" />
                  </a>
                )}
              </div>
            </div>
            {assoc.certifications && assoc.certifications.length > 0 && (
              <div className="flex gap-1 mt-2">
                {assoc.certifications.slice(0, 2).map((cert, i) => (
                  <span key={i} className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
                    {cert.sigle}
                  </span>
                ))}
                {assoc.certifications.length > 2 && (
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                    +{assoc.certifications.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <a href="/ressources/associations" className="text-sm text-teal-600 hover:underline flex items-center gap-1">
          Voir toutes les associations <ChevronRight size={14} />
        </a>
      </div>
    </div>
  );
}

// Statistiques rapides
function QuickStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <Shield size={24} className="opacity-80 mb-2" />
        <p className="text-2xl font-bold">{Object.keys(RBQ_CATEGORIES).length}</p>
        <p className="text-sm opacity-90">Catégories RBQ</p>
      </div>
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
        <HardHat size={24} className="opacity-80 mb-2" />
        <p className="text-2xl font-bold">{Object.keys(CCQ_METIERS).length}</p>
        <p className="text-sm opacity-90">Métiers CCQ</p>
      </div>
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
        <Briefcase size={24} className="opacity-80 mb-2" />
        <p className="text-2xl font-bold">4</p>
        <p className="text-sm opacity-90">Sources d'appels</p>
      </div>
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white">
        <Award size={24} className="opacity-80 mb-2" />
        <p className="text-2xl font-bold">{ASSOCIATIONS_QUEBEC.length}</p>
        <p className="text-sm opacity-90">Associations</p>
      </div>
    </div>
  );
}

// ============ PAGE PRINCIPALE ============

export default function QuebecDashboard() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
              <Building2 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Intégrations Québec</h1>
              <p className="text-gray-500">RBQ • CCQ • Paie • Appels d'offres • Associations</p>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <QuickStats />

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RBQWidget />
          <CCQTauxWidget />
          <PaieCalculatorWidget />
          <AppelsOffresWidget />
          <AssociationsWidget />
          
          {/* Widget Info */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-sm p-6 text-white">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Avantages DAST Solutions
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>Données officielles RBQ en temps réel avec cache intelligent</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>Taux CCQ 2025-2026 pour 20 métiers et 4 secteurs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>Calcul de paie complet avec DAS Québec (RRQ, RQAP, AE, FSS)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>Agrégation multi-sources: SEAO, MERX, BuyGC, Bonfire</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>12 associations professionnelles avec certifications</span>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Conçu spécifiquement pour le marché de la construction au Québec
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
