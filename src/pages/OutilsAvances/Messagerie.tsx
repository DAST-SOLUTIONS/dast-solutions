/**
 * DAST Solutions - Messagerie
 * Communication interne et notifications
 */
import { useState } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { MessageSquare, Send, Search, Plus, Users, User, Paperclip, Image, Smile, Phone, Video, MoreVertical, Check, CheckCheck, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const DEMO_CONVERSATIONS = [
  { id: '1', name: 'Équipe Centre sportif', type: 'group', members: 8, lastMessage: 'Les plans ont été mis à jour', lastTime: '2024-12-15T14:30:00', unread: 3 },
  { id: '2', name: 'Jean Tremblay', type: 'direct', lastMessage: 'OK pour demain matin', lastTime: '2024-12-15T13:15:00', unread: 0 },
  { id: '3', name: 'Marie Dubois', type: 'direct', lastMessage: 'Voici le bordereau modifié', lastTime: '2024-12-15T11:00:00', unread: 1 },
  { id: '4', name: 'Équipe Électricité', type: 'group', members: 5, lastMessage: 'Réunion confirmée à 15h', lastTime: '2024-12-14T16:45:00', unread: 0 },
]

const DEMO_MESSAGES = [
  { id: '1', sender: 'Jean Tremblay', content: 'Bonjour, où en est le projet?', time: '09:30', isMe: false },
  { id: '2', sender: 'Moi', content: 'On avance bien, les fondations sont terminées', time: '09:35', isMe: true, status: 'read' },
  { id: '3', sender: 'Jean Tremblay', content: 'Parfait! Et pour les matériaux?', time: '09:40', isMe: false },
  { id: '4', sender: 'Moi', content: 'Livraison prévue demain matin', time: '09:42', isMe: true, status: 'delivered' },
  { id: '5', sender: 'Jean Tremblay', content: 'OK pour demain matin', time: '09:45', isMe: false },
]

export default function Messagerie() {
  const [selectedConv, setSelectedConv] = useState(DEMO_CONVERSATIONS[0])
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Messagerie" />
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Plus size={18} />Nouvelle conversation</button>
      </div>
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Liste conversations */}
        <div className="bg-white rounded-xl border overflow-hidden flex flex-col">
          <div className="p-4 border-b"><div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div></div>
          <div className="flex-1 overflow-y-auto">
            {DEMO_CONVERSATIONS.map(conv => (
              <div key={conv.id} onClick={() => setSelectedConv(conv)} className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedConv.id === conv.id ? 'bg-teal-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${conv.type === 'group' ? 'bg-teal-100' : 'bg-blue-100'}`}>
                    {conv.type === 'group' ? <Users size={20} className="text-teal-600" /> : <User size={20} className="text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between"><span className="font-medium truncate">{conv.name}</span><span className="text-xs text-gray-500">{format(new Date(conv.lastTime), 'HH:mm')}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500 truncate">{conv.lastMessage}</span>{conv.unread > 0 && <span className="bg-teal-500 text-white text-xs rounded-full px-2">{conv.unread}</span>}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Zone de chat */}
        <div className="lg:col-span-2 bg-white rounded-xl border overflow-hidden flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedConv.type === 'group' ? 'bg-teal-100' : 'bg-blue-100'}`}>
                {selectedConv.type === 'group' ? <Users size={18} className="text-teal-600" /> : <User size={18} className="text-blue-600" />}
              </div>
              <div><div className="font-medium">{selectedConv.name}</div>{selectedConv.type === 'group' && <div className="text-xs text-gray-500">{selectedConv.members} membres</div>}</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg"><Phone size={18} /></button>
              <button className="p-2 hover:bg-gray-100 rounded-lg"><Video size={18} /></button>
              <button className="p-2 hover:bg-gray-100 rounded-lg"><MoreVertical size={18} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {DEMO_MESSAGES.map(msg => (
              <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.isMe ? 'bg-teal-600 text-white' : 'bg-white border'}`}>
                  {!msg.isMe && <div className="text-xs font-medium text-teal-600 mb-1">{msg.sender}</div>}
                  <p>{msg.content}</p>
                  <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${msg.isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                    {msg.time}
                    {msg.isMe && (msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg"><Paperclip size={20} className="text-gray-500" /></button>
              <button className="p-2 hover:bg-gray-100 rounded-lg"><Image size={20} className="text-gray-500" /></button>
              <input type="text" placeholder="Écrire un message..." value={message} onChange={e => setMessage(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" />
              <button className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Send size={20} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
