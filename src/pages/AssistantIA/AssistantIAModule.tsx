import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Bot, User, Paperclip, Image, FileText,
  Search, Settings, Sparkles, ThumbsUp, ThumbsDown, Copy, RefreshCw,
  Building2, DollarSign, Calendar, Users, Clock, ChevronRight,
  Mic, MicOff, X, Plus, History, Star, Zap, Brain
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  actions?: QuickAction[];
}

interface Source {
  type: 'document' | 'projet' | 'facture' | 'plan';
  nom: string;
  extrait?: string;
}

interface QuickAction {
  label: string;
  action: string;
}

interface Conversation {
  id: string;
  titre: string;
  date: string;
  messages: number;
}

const AssistantIAModule: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour! Je suis votre assistant IA pour la gestion de projets construction. Je peux vous aider avec:\n\n• **Recherche de documents** - Plans, devis, contrats\n• **Informations projet** - Budget, avancement, équipes\n• **Analyses** - Coûts, rentabilité, tendances\n• **Questions techniques** - Normes, spécifications\n\nComment puis-je vous aider aujourd\'hui?',
      timestamp: new Date(),
      actions: [
        { label: 'État du projet Tour Deloitte', action: 'project_status' },
        { label: 'Budget restant', action: 'budget_check' },
        { label: 'Documents récents', action: 'recent_docs' },
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedProject, setSelectedProject] = useState('Tour Deloitte');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations] = useState<Conversation[]>([
    { id: '1', titre: 'Budget Tour Deloitte', date: '2026-01-10', messages: 8 },
    { id: '2', titre: 'Recherche plans niveau 3', date: '2026-01-09', messages: 5 },
    { id: '3', titre: 'Analyse coûts béton', date: '2026-01-08', messages: 12 },
    { id: '4', titre: 'Équipe disponible', date: '2026-01-07', messages: 4 },
  ]);

  const quickPrompts = [
    'Quel est l\'avancement du projet?',
    'Montre-moi les dernières factures',
    'Qui travaille sur le chantier aujourd\'hui?',
    'Résume les RFI en cours',
    'Compare le budget vs réel',
    'Prochaines échéances importantes',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: generateResponse(inputValue),
        timestamp: new Date(),
        sources: [
          { type: 'projet', nom: 'Tour Deloitte - Dashboard', extrait: 'Avancement global: 45%' },
          { type: 'document', nom: 'Rapport hebdomadaire - Semaine 2', extrait: 'Progression conforme au calendrier' },
        ],
        actions: [
          { label: 'Voir le détail', action: 'view_detail' },
          { label: 'Exporter rapport', action: 'export' },
        ]
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    if (q.includes('avancement') || q.includes('état') || q.includes('progress')) {
      return `📊 **État du projet ${selectedProject}**\n\nL'avancement global est de **45%**, ce qui est conforme au calendrier prévu.\n\n**Par phase:**\n• Phase 1 - Fondations: ✅ 100% (terminé)\n• Phase 2 - Structure: 🔄 65% (en cours)\n• Phase 3 - Enveloppe: ⏳ 10% (démarré)\n• Phase 4 - Finition: ⏸️ 0% (à venir)\n\n**Points d'attention:**\n- Livraison acier prévue le 15 janvier\n- 2 RFI en attente de réponse`;
    }
    
    if (q.includes('budget') || q.includes('coût') || q.includes('dépense')) {
      return `💰 **Analyse budgétaire - ${selectedProject}**\n\n**Budget total:** 12,500,000 $\n**Dépensé à date:** 5,625,000 $ (45%)\n**Engagé:** 2,100,000 $\n**Disponible:** 4,775,000 $\n\n**Écarts significatifs:**\n• Béton: +3.2% (hausse des prix)\n• Main-d'œuvre: -1.5% (efficacité)\n• Équipements: Sur budget\n\n**Prévision finale:** 12,380,000 $ ✅`;
    }
    
    if (q.includes('équipe') || q.includes('travail') || q.includes('personnel')) {
      return `👷 **Équipe sur chantier - ${selectedProject}**\n\n**Aujourd'hui (12 janvier):** 45 personnes\n\n**Par corps de métier:**\n• Charpentiers-menuisiers: 12\n• Ferrailleurs: 8\n• Électriciens: 6\n• Manœuvres: 15\n• Supervision: 4\n\n**Sous-traitants présents:**\n• Acier MTL (structure)\n• Électro Plus (filage)\n\n**Heures prévues:** 8h à 17h\n**Météo:** -5°C, dégagé ☀️`;
    }
    
    if (q.includes('facture') || q.includes('paiement')) {
      return `📄 **Dernières factures - ${selectedProject}**\n\n| Fournisseur | Montant | Statut |\n|-------------|---------|--------|\n| Béton Québec | 52,026 $ | En attente |\n| Acier MTL | 128,500 $ | Approuvée |\n| Électro Plus | 32,000 $ | Payée |\n| Location Équip. | 8,500 $ | En attente |\n\n**Total en attente:** 60,526 $\n**À approuver cette semaine:** 3 factures`;
    }
    
    return `J'ai analysé votre demande concernant "${query}".\n\nVoici ce que j'ai trouvé dans la base de données du projet ${selectedProject}:\n\n📁 **Documents pertinents:** 3 fichiers\n📊 **Données projet:** Mis à jour il y a 2h\n💡 **Suggestion:** Vous pourriez également consulter le rapport hebdomadaire pour plus de détails.\n\nVoulez-vous que j'approfondisse un aspect particulier?`;
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="text-indigo-600" />
            Assistant IA Projet
          </h1>
          <p className="text-gray-600">Posez vos questions sur vos projets de construction</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option>Tour Deloitte</option>
            <option>Centre Bell</option>
            <option>Résidence Soleil</option>
            <option>Tous les projets</option>
          </select>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <History size={18} />
            Historique
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus size={18} />
            Nouvelle conversation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar - Historique */}
        {showHistory && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <History size={18} className="text-gray-500" />
                Conversations récentes
              </h3>
            </div>
            <div className="divide-y">
              {conversations.map((conv) => (
                <div key={conv.id} className="p-3 hover:bg-gray-50 cursor-pointer">
                  <p className="font-medium text-sm">{conv.titre}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{conv.date}</span>
                    <span className="text-xs text-gray-400">{conv.messages} messages</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat principal */}
        <div className={`${showHistory ? 'col-span-2' : 'col-span-3'} bg-white rounded-xl shadow-sm border flex flex-col h-[calc(100vh-200px)]`}>
          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' ? 'bg-blue-100' : 'bg-indigo-100'
                }`}>
                  {message.role === 'user' ? (
                    <User size={18} className="text-blue-600" />
                  ) : (
                    <Bot size={18} className="text-indigo-600" />
                  )}
                </div>
                <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }} />
                  </div>
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Search size={10} />
                        Sources:
                      </p>
                      {message.sources.map((source, i) => (
                        <div key={i} className="text-xs bg-gray-50 rounded px-2 py-1 inline-block mr-1">
                          <span className="text-indigo-600">{source.nom}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions rapides */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.actions.map((action, i) => (
                        <button 
                          key={i}
                          className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Feedback */}
                  {message.role === 'assistant' && (
                    <div className="mt-2 flex items-center gap-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <ThumbsUp size={12} className="text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <ThumbsDown size={12} className="text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Copy size={12} className="text-gray-400" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot size={18} className="text-indigo-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 py-2 border-t flex gap-2 overflow-x-auto">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleQuickPrompt(prompt)}
                className="flex-shrink-0 text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-3">
              <button className="p-2 border rounded-lg hover:bg-gray-50">
                <Paperclip size={20} className="text-gray-500" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Panneau contextuel */}
        <div className="space-y-4">
          {/* Contexte projet */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" />
              Contexte actuel
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Projet</span>
                <span className="font-medium text-sm">{selectedProject}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Avancement</span>
                <span className="font-medium text-sm">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Budget utilisé</span>
                <span className="font-medium text-sm">5.6M$ / 12.5M$</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Équipe</span>
                <span className="font-medium text-sm">45 personnes</span>
              </div>
            </div>
          </div>

          {/* Capacités IA */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-500" />
              Capacités IA
            </h3>
            <div className="space-y-2">
              {[
                { icon: Search, label: 'Recherche documents', desc: 'Plans, devis, contrats' },
                { icon: DollarSign, label: 'Analyse financière', desc: 'Budget, coûts, prévisions' },
                { icon: Calendar, label: 'Suivi planning', desc: 'Échéances, retards' },
                { icon: Users, label: 'Gestion équipe', desc: 'Présences, affectations' },
              ].map((cap, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50">
                  <cap.icon size={16} className="text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{cap.label}</p>
                    <p className="text-xs text-gray-500">{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents récents */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText size={18} className="text-green-600" />
              Documents récents
            </h3>
            <div className="space-y-2">
              {[
                'Rapport hebdo - Sem. 2',
                'Plan structure N3 - Rev.C',
                'Facture Béton Québec',
                'RFI-028 - Hauteur plafond',
              ].map((doc, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <FileText size={14} className="text-gray-400" />
                  <span className="text-sm truncate">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantIAModule;
