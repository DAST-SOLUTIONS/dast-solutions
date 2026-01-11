/**
 * DAST Solutions - Centre d'Intégrations
 * CCQ, RBQ, Services Cloud, Webhooks, API externes
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plug, Settings, RefreshCw, Check, X, AlertCircle, ExternalLink,
  Cloud, Database, Webhook, Key, Shield, Zap, Clock, Activity,
  Building2, HardHat, Users, DollarSign, FileText, Link2,
  ChevronRight, ChevronDown, Plus, Trash2, Edit, Eye, EyeOff,
  Play, Pause, Copy, CheckCircle, XCircle, Loader2, Info,
  Globe, Lock, Unlock, Server, Bell, Send, Download, Upload
} from 'lucide-react'

// Types
interface Integration {
  id: string
  name: string
  description: string
  category: 'quebec' | 'cloud' | 'accounting' | 'communication' | 'custom'
  icon: string
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  lastSync?: string
  config?: Record<string, any>
  features: string[]
}

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  secret?: string
  lastTriggered?: string
  successCount: number
  failureCount: number
}

interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  createdAt: string
  lastUsed?: string
  expiresAt?: string
  isActive: boolean
}

// Intégrations disponibles
const AVAILABLE_INTEGRATIONS: Omit<Integration, 'status' | 'lastSync'>[] = [
  {
    id: 'ccq',
    name: 'CCQ - Commission de la construction',
    description: 'Taux horaires officiels, conventions collectives, métiers',
    category: 'quebec',
    icon: '🏗️',
    features: ['Taux horaires par métier', 'Avantages sociaux', 'Vacances & congés', 'Zones salariales']
  },
  {
    id: 'rbq',
    name: 'RBQ - Régie du bâtiment',
    description: 'Vérification des licences et conformité des entrepreneurs',
    category: 'quebec',
    icon: '🛡️',
    features: ['Recherche de licence', 'Validation de conformité', 'Catégories autorisées', 'Historique']
  },
  {
    id: 'seao',
    name: 'SEAO - Appels d\'offres publics',
    description: 'Système électronique d\'appel d\'offres du Québec',
    category: 'quebec',
    icon: '📋',
    features: ['Nouveaux appels', 'Alertes personnalisées', 'Téléchargement documents', 'Suivi soumissions']
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Stockage et partage de fichiers dans le cloud',
    category: 'cloud',
    icon: '📁',
    features: ['Sync automatique', 'Partage de plans', 'Backup documents', 'Collaboration']
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Stockage cloud et partage de fichiers',
    category: 'cloud',
    icon: '📦',
    features: ['Sync bidirectionnelle', 'Historique versions', 'Partage sécurisé', 'Intégration plans']
  },
  {
    id: 'onedrive',
    name: 'Microsoft OneDrive',
    description: 'Stockage cloud Microsoft 365',
    category: 'cloud',
    icon: '☁️',
    features: ['Sync Office 365', 'Excel en ligne', 'SharePoint', 'Teams integration']
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Comptabilité et facturation',
    category: 'accounting',
    icon: '💰',
    features: ['Sync factures', 'Clients & fournisseurs', 'Rapports financiers', 'Paiements']
  },
  {
    id: 'sage',
    name: 'Sage 50',
    description: 'Logiciel comptable pour PME',
    category: 'accounting',
    icon: '📊',
    features: ['Import/Export', 'Plan comptable', 'Rapprochement', 'Taxes TPS/TVQ']
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Communication d\'équipe et notifications',
    category: 'communication',
    icon: '💬',
    features: ['Notifications projet', 'Alertes soumission', 'Rappels échéances', 'Rapports automatiques']
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Collaboration et communication Microsoft',
    category: 'communication',
    icon: '👥',
    features: ['Messages & canaux', 'Réunions', 'Fichiers partagés', 'Notifications']
  },
  {
    id: 'togal',
    name: 'Togal.ai',
    description: 'IA pour extraction automatique de plans',
    category: 'custom',
    icon: '🤖',
    features: ['Détection surfaces', 'Mesures automatiques', 'Classification éléments', 'Export quantités']
  },
  {
    id: 'autodesk',
    name: 'Autodesk Construction Cloud',
    description: 'Suite de gestion de construction Autodesk',
    category: 'custom',
    icon: '🏢',
    features: ['BIM 360', 'Plans & modèles', 'RFI & submittals', 'Coordination']
  }
]

// Événements webhook disponibles
const WEBHOOK_EVENTS = [
  { id: 'project.created', name: 'Projet créé', category: 'Projets' },
  { id: 'project.updated', name: 'Projet modifié', category: 'Projets' },
  { id: 'project.completed', name: 'Projet terminé', category: 'Projets' },
  { id: 'soumission.created', name: 'Soumission créée', category: 'Soumissions' },
  { id: 'soumission.sent', name: 'Soumission envoyée', category: 'Soumissions' },
  { id: 'soumission.accepted', name: 'Soumission acceptée', category: 'Soumissions' },
  { id: 'soumission.rejected', name: 'Soumission refusée', category: 'Soumissions' },
  { id: 'invoice.created', name: 'Facture créée', category: 'Factures' },
  { id: 'invoice.paid', name: 'Facture payée', category: 'Factures' },
  { id: 'invoice.overdue', name: 'Facture en retard', category: 'Factures' },
  { id: 'document.uploaded', name: 'Document uploadé', category: 'Documents' },
  { id: 'alert.triggered', name: 'Alerte déclenchée', category: 'Système' },
]

export default function IntegrationCenter() {
  const navigate = useNavigate()
  
  // États
  const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks' | 'api'>('integrations')
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [showCCQPanel, setShowCCQPanel] = useState(false)
  const [showRBQPanel, setShowRBQPanel] = useState(false)

  useEffect(() => {
    loadIntegrations()
    loadWebhooks()
    loadAPIKeys()
  }, [])

  const loadIntegrations = () => {
    // Simuler les intégrations avec statuts
    const loaded: Integration[] = AVAILABLE_INTEGRATIONS.map(int => ({
      ...int,
      status: ['ccq', 'rbq'].includes(int.id) ? 'connected' : 
              ['google-drive'].includes(int.id) ? 'pending' : 'disconnected',
      lastSync: ['ccq', 'rbq'].includes(int.id) ? new Date().toISOString() : undefined
    }))
    setIntegrations(loaded)
  }

  const loadWebhooks = () => {
    // Données de démo
    setWebhooks([
      {
        id: 'wh-1',
        name: 'Notification Slack - Soumissions',
        url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
        events: ['soumission.created', 'soumission.accepted', 'soumission.rejected'],
        isActive: true,
        lastTriggered: new Date(Date.now() - 3600000).toISOString(),
        successCount: 45,
        failureCount: 2
      },
      {
        id: 'wh-2',
        name: 'CRM Update - Projets',
        url: 'https://api.zoho.com/webhook/projects',
        events: ['project.created', 'project.completed'],
        isActive: true,
        lastTriggered: new Date(Date.now() - 86400000).toISOString(),
        successCount: 28,
        failureCount: 0
      }
    ])
  }

  const loadAPIKeys = () => {
    setApiKeys([
      {
        id: 'key-1',
        name: 'Application Mobile',
        key: 'dast_live_xxxxxxxxxxxxxxxxxxxxxxxx',
        permissions: ['read:projects', 'read:soumissions', 'write:documents'],
        createdAt: '2025-01-01T00:00:00Z',
        lastUsed: new Date(Date.now() - 7200000).toISOString(),
        isActive: true
      },
      {
        id: 'key-2',
        name: 'Intégration Comptabilité',
        key: 'dast_live_yyyyyyyyyyyyyyyyyyyyyyyy',
        permissions: ['read:invoices', 'read:clients'],
        createdAt: '2024-12-15T00:00:00Z',
        lastUsed: new Date(Date.now() - 86400000).toISOString(),
        expiresAt: '2025-12-15T00:00:00Z',
        isActive: true
      }
    ])
  }

  const handleConnect = async (integrationId: string) => {
    setIsConnecting(integrationId)
    
    // Simuler la connexion
    await new Promise(r => setTimeout(r, 2000))
    
    if (integrationId === 'ccq') {
      setShowCCQPanel(true)
    } else if (integrationId === 'rbq') {
      setShowRBQPanel(true)
    } else {
      // Simuler OAuth ou configuration
      setIntegrations(prev => prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: 'connected', lastSync: new Date().toISOString() }
          : int
      ))
    }
    
    setIsConnecting(null)
  }

  const handleDisconnect = (integrationId: string) => {
    if (confirm('Déconnecter cette intégration?')) {
      setIntegrations(prev => prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: 'disconnected', lastSync: undefined }
          : int
      ))
    }
  }

  const handleSync = async (integrationId: string) => {
    setIsConnecting(integrationId)
    await new Promise(r => setTimeout(r, 1500))
    setIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { ...int, lastSync: new Date().toISOString() }
        : int
    ))
    setIsConnecting(null)
  }

  const toggleWebhook = (webhookId: string) => {
    setWebhooks(prev => prev.map(wh => 
      wh.id === webhookId ? { ...wh, isActive: !wh.isActive } : wh
    ))
  }

  const deleteWebhook = (webhookId: string) => {
    if (confirm('Supprimer ce webhook?')) {
      setWebhooks(prev => prev.filter(wh => wh.id !== webhookId))
    }
  }

  const toggleAPIKey = (keyId: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, isActive: !key.isActive } : key
    ))
  }

  const deleteAPIKey = (keyId: string) => {
    if (confirm('Révoquer cette clé API? Cette action est irréversible.')) {
      setApiKeys(prev => prev.filter(key => key.id !== keyId))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copié dans le presse-papiers!')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-CA', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12} /> Connecté</span>
      case 'disconnected':
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1"><XCircle size={12} /> Déconnecté</span>
      case 'error':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1"><AlertCircle size={12} /> Erreur</span>
      case 'pending':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-1"><Clock size={12} /> En attente</span>
    }
  }

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(int => int.category === selectedCategory)

  const categories = [
    { id: 'all', name: 'Toutes', icon: Plug },
    { id: 'quebec', name: 'Québec', icon: Building2 },
    { id: 'cloud', name: 'Cloud', icon: Cloud },
    { id: 'accounting', name: 'Comptabilité', icon: DollarSign },
    { id: 'communication', name: 'Communication', icon: Bell },
    { id: 'custom', name: 'Spécialisé', icon: Zap },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Plug className="text-teal-600" />
            Intégrations & API
          </h1>
          <p className="text-gray-500">Connectez vos outils et automatisez vos flux</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('integrations')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'integrations' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Link2 size={18} />
          Intégrations ({integrations.filter(i => i.status === 'connected').length}/{integrations.length})
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'webhooks' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Webhook size={18} />
          Webhooks ({webhooks.length})
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'api' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Key size={18} />
          Clés API ({apiKeys.length})
        </button>
      </div>

      {/* Tab: Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                  selectedCategory === cat.id
                    ? 'bg-teal-100 text-teal-700 border border-teal-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <cat.icon size={16} />
                {cat.name}
              </button>
            ))}
          </div>

          {/* Integrations Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map(integration => (
              <div key={integration.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{integration.icon}</span>
                    <div>
                      <h3 className="font-semibold">{integration.name}</h3>
                      {getStatusBadge(integration.status)}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-3">{integration.description}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {integration.features.slice(0, 3).map((feature, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {feature}
                    </span>
                  ))}
                  {integration.features.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded">
                      +{integration.features.length - 3}
                    </span>
                  )}
                </div>

                {integration.lastSync && (
                  <p className="text-xs text-gray-400 mb-3">
                    Dernière sync: {formatDate(integration.lastSync)}
                  </p>
                )}

                <div className="flex gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => handleSync(integration.id)}
                        disabled={isConnecting === integration.id}
                        className="flex-1 py-2 border rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-1"
                      >
                        {isConnecting === integration.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        Synchroniser
                      </button>
                      <button
                        onClick={() => {
                          if (integration.id === 'ccq') setShowCCQPanel(true)
                          else if (integration.id === 'rbq') setShowRBQPanel(true)
                        }}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                        title="Configurer"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                        title="Déconnecter"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration.id)}
                      disabled={isConnecting === integration.id}
                      className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex items-center justify-center gap-1"
                    >
                      {isConnecting === integration.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plug size={14} />
                      )}
                      Connecter
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Recevez des notifications automatiques lors d'événements
            </p>
            <button
              onClick={() => {
                setEditingWebhook(null)
                setShowWebhookModal(true)
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Nouveau Webhook
            </button>
          </div>

          {webhooks.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <Webhook size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">Aucun webhook configuré</p>
              <button
                onClick={() => setShowWebhookModal(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Créer votre premier webhook
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map(webhook => (
                <div key={webhook.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${webhook.isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                        <Webhook size={20} className={webhook.isActive ? 'text-emerald-600' : 'text-gray-400'} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{webhook.name}</h3>
                        <p className="text-sm text-gray-500 font-mono truncate max-w-md">{webhook.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleWebhook(webhook.id)}
                        className={`p-2 rounded-lg ${webhook.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}
                        title={webhook.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {webhook.isActive ? <Play size={16} /> : <Pause size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingWebhook(webhook)
                          setShowWebhookModal(true)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteWebhook(webhook.id)}
                        className="p-2 hover:bg-red-100 text-red-500 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {webhook.events.map(event => (
                      <span key={event} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {WEBHOOK_EVENTS.find(e => e.id === event)?.name || event}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle size={12} className="text-emerald-500" />
                      {webhook.successCount} succès
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle size={12} className="text-red-500" />
                      {webhook.failureCount} échecs
                    </span>
                    {webhook.lastTriggered && (
                      <span>Dernier appel: {formatDate(webhook.lastTriggered)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: API Keys */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Gérez vos clés d'accès à l'API DAST Solutions
            </p>
            <button
              onClick={() => setShowAPIKeyModal(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Nouvelle clé API
            </button>
          </div>

          {/* API Documentation Link */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-600" size={24} />
              <div>
                <h4 className="font-medium text-blue-800">Documentation API</h4>
                <p className="text-sm text-blue-600">Consultez la documentation complète de l'API</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <ExternalLink size={16} />
              Voir la doc
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <Key size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">Aucune clé API créée</p>
              <button
                onClick={() => setShowAPIKeyModal(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Créer votre première clé
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map(apiKey => (
                <div key={apiKey.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${apiKey.isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                        <Key size={20} className={apiKey.isActive ? 'text-emerald-600' : 'text-gray-400'} />
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {apiKey.name}
                          {!apiKey.isActive && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">Désactivée</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {apiKey.key.substring(0, 20)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(apiKey.key)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Copier"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAPIKey(apiKey.id)}
                        className={`p-2 rounded-lg ${apiKey.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}
                        title={apiKey.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {apiKey.isActive ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                      <button
                        onClick={() => deleteAPIKey(apiKey.id)}
                        className="p-2 hover:bg-red-100 text-red-500 rounded-lg"
                        title="Révoquer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {apiKey.permissions.map(perm => (
                      <span key={perm} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        {perm}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-gray-500">
                    <span>Créée le {formatDate(apiKey.createdAt)}</span>
                    {apiKey.lastUsed && <span>Dernière utilisation: {formatDate(apiKey.lastUsed)}</span>}
                    {apiKey.expiresAt && (
                      <span className="text-amber-600">Expire le {formatDate(apiKey.expiresAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CCQ Panel */}
      {showCCQPanel && (
        <CCQPanel onClose={() => setShowCCQPanel(false)} />
      )}

      {/* RBQ Panel */}
      {showRBQPanel && (
        <RBQPanel onClose={() => setShowRBQPanel(false)} />
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <WebhookModal
          webhook={editingWebhook}
          events={WEBHOOK_EVENTS}
          onSave={(webhook) => {
            if (editingWebhook) {
              setWebhooks(prev => prev.map(wh => wh.id === webhook.id ? webhook : wh))
            } else {
              setWebhooks(prev => [...prev, { ...webhook, id: `wh-${Date.now()}` }])
            }
            setShowWebhookModal(false)
            setEditingWebhook(null)
          }}
          onClose={() => {
            setShowWebhookModal(false)
            setEditingWebhook(null)
          }}
        />
      )}

      {/* API Key Modal */}
      {showAPIKeyModal && (
        <APIKeyModal
          onSave={(key) => {
            setApiKeys(prev => [...prev, { ...key, id: `key-${Date.now()}` }])
            setShowAPIKeyModal(false)
          }}
          onClose={() => setShowAPIKeyModal(false)}
        />
      )}
    </div>
  )
}

// CCQ Panel Component
function CCQPanel({ onClose }: { onClose: () => void }) {
  const [selectedTrade, setSelectedTrade] = useState('charpentier-menuisier')
  const [selectedZone, setSelectedZone] = useState('A')

  // Données simulées CCQ
  const trades = [
    { id: 'charpentier-menuisier', name: 'Charpentier-menuisier', rate: 45.78 },
    { id: 'electricien', name: 'Électricien', rate: 48.52 },
    { id: 'plombier', name: 'Plombier', rate: 47.95 },
    { id: 'ferblantier', name: 'Ferblantier', rate: 46.80 },
    { id: 'briqueteur-maçon', name: 'Briqueteur-maçon', rate: 46.25 },
    { id: 'cimentier-applicateur', name: 'Cimentier-applicateur', rate: 44.90 },
    { id: 'grutier', name: 'Grutier', rate: 52.15 },
    { id: 'operateur-pelle', name: 'Opérateur de pelle', rate: 49.30 },
  ]

  const zones = ['A', 'B', 'C']
  const currentTrade = trades.find(t => t.id === selectedTrade)
  const zoneMultiplier = selectedZone === 'A' ? 1.0 : selectedZone === 'B' ? 0.97 : 0.94

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-blue-50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏗️</span>
            <div>
              <h2 className="text-lg font-bold">CCQ - Taux horaires</h2>
              <p className="text-sm text-gray-600">Commission de la construction du Québec</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Métier</label>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {trades.map(trade => (
                  <option key={trade.id} value={trade.id}>{trade.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zone salariale</label>
              <div className="flex gap-2">
                {zones.map(zone => (
                  <button
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={`flex-1 py-2 rounded-lg ${
                      selectedZone === zone
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Zone {zone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {currentTrade && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold mb-4">{currentTrade.name} - Zone {selectedZone}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-500">Taux horaire de base</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(currentTrade.rate * zoneMultiplier).toFixed(2)} $/h
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-500">Temps supplémentaire (1.5x)</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {(currentTrade.rate * zoneMultiplier * 1.5).toFixed(2)} $/h
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-500">Avantages sociaux (~35%)</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {(currentTrade.rate * zoneMultiplier * 0.35).toFixed(2)} $/h
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-500">Coût total employeur</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(currentTrade.rate * zoneMultiplier * 1.35).toFixed(2)} $/h
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <Info size={16} className="inline mr-2" />
                Taux en vigueur au 1er mai 2024. Vérifiez sur ccq.org pour les taux actuels.
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Download size={16} />
            Exporter les taux
          </button>
        </div>
      </div>
    </div>
  )
}

// RBQ Panel Component
function RBQPanel({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    await new Promise(r => setTimeout(r, 1000))
    
    // Résultats simulés
    setSearchResults([
      {
        name: 'Construction ABC Inc.',
        license: '8001-2345-67',
        status: 'Valide',
        categories: ['1.1.1 - Bâtiments résidentiels', '1.1.2 - Bâtiments commerciaux'],
        expiryDate: '2025-12-31',
        region: 'Montréal'
      },
      {
        name: 'Rénovations XYZ Ltée',
        license: '8001-3456-78',
        status: 'Valide',
        categories: ['1.2 - Résidentiel léger'],
        expiryDate: '2025-06-30',
        region: 'Laval'
      }
    ])
    
    setIsSearching(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <h2 className="text-lg font-bold">RBQ - Vérification de licence</h2>
              <p className="text-sm text-gray-600">Régie du bâtiment du Québec</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom de l'entreprise ou numéro de licence..."
              className="flex-1 px-4 py-2 border rounded-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Globe size={16} />
              )}
              Rechercher
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map((result, i) => (
                <div key={i} className="border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{result.name}</h3>
                      <p className="text-sm text-gray-500">Licence: {result.license}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      result.status === 'Valide' 
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {result.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Catégories autorisées:</p>
                      <ul className="list-disc list-inside">
                        {result.categories.map((cat: string, j: number) => (
                          <li key={j}>{cat}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-gray-500">Expiration:</p>
                      <p className="font-medium">{result.expiryDate}</p>
                      <p className="text-gray-500 mt-2">Région:</p>
                      <p className="font-medium">{result.region}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              <Shield size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Entrez un nom d'entreprise ou numéro de licence pour rechercher</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// Webhook Modal Component
function WebhookModal({ 
  webhook, 
  events, 
  onSave, 
  onClose 
}: { 
  webhook: Webhook | null
  events: typeof WEBHOOK_EVENTS
  onSave: (webhook: Webhook) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<Webhook>>(webhook || {
    name: '',
    url: '',
    events: [],
    isActive: true,
    successCount: 0,
    failureCount: 0
  })

  const toggleEvent = (eventId: string) => {
    setForm(prev => ({
      ...prev,
      events: prev.events?.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...(prev.events || []), eventId]
    }))
  }

  const handleSave = () => {
    if (!form.name || !form.url || !form.events?.length) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    onSave(form as Webhook)
  }

  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = []
    acc[event.category].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">{webhook ? 'Modifier le webhook' : 'Nouveau webhook'}</h2>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mon webhook"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL *</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Événements *</label>
              <div className="space-y-3">
                {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
                  <div key={category}>
                    <p className="text-xs text-gray-500 uppercase mb-1">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {categoryEvents.map(event => (
                        <button
                          key={event.id}
                          onClick={() => toggleEvent(event.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            form.events?.includes(event.id)
                              ? 'bg-teal-100 text-teal-700 border border-teal-300'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {event.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            {webhook ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// API Key Modal Component
function APIKeyModal({ onSave, onClose }: { onSave: (key: APIKey) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    permissions: [] as string[],
    expiresIn: 'never'
  })

  const allPermissions = [
    { id: 'read:projects', name: 'Lire projets' },
    { id: 'write:projects', name: 'Modifier projets' },
    { id: 'read:soumissions', name: 'Lire soumissions' },
    { id: 'write:soumissions', name: 'Modifier soumissions' },
    { id: 'read:invoices', name: 'Lire factures' },
    { id: 'write:invoices', name: 'Modifier factures' },
    { id: 'read:clients', name: 'Lire clients' },
    { id: 'write:clients', name: 'Modifier clients' },
    { id: 'read:documents', name: 'Lire documents' },
    { id: 'write:documents', name: 'Upload documents' },
  ]

  const togglePermission = (permId: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }))
  }

  const handleCreate = () => {
    if (!form.name || form.permissions.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    const newKey: APIKey = {
      id: '',
      name: form.name,
      key: `dast_live_${Math.random().toString(36).substring(2, 34)}`,
      permissions: form.permissions,
      createdAt: new Date().toISOString(),
      isActive: true,
      expiresAt: form.expiresIn !== 'never' 
        ? new Date(Date.now() + parseInt(form.expiresIn) * 24 * 60 * 60 * 1000).toISOString()
        : undefined
    }

    onSave(newKey)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Nouvelle clé API</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom de la clé *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Application mobile, Intégration..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Permissions *</label>
            <div className="grid grid-cols-2 gap-2">
              {allPermissions.map(perm => (
                <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{perm.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expiration</label>
            <select
              value={form.expiresIn}
              onChange={(e) => setForm({ ...form, expiresIn: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="never">Jamais</option>
              <option value="30">30 jours</option>
              <option value="90">90 jours</option>
              <option value="365">1 an</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Créer la clé
          </button>
        </div>
      </div>
    </div>
  )
}
