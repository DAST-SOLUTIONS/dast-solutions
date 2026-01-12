import React, { useState } from 'react';
import { 
  MessageSquare, Send, Plus, Search, Hash, Users, Settings,
  Paperclip, Smile, MoreVertical, Phone, Video, Pin, Star,
  ChevronDown, Bell, BellOff, X, Image, File
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  type: 'project' | 'team' | 'direct';
  unread: number;
  lastMessage: string;
  lastTime: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
  attachments?: { name: string; type: string }[];
}

const MessagingModule: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState('1');
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [channels] = useState<Channel[]>([
    { id: '1', name: 'Tour Deloitte', type: 'project', unread: 3, lastMessage: 'Les coffrages sont prêts pour demain', lastTime: '10:45' },
    { id: '2', name: 'Équipe Fondations', type: 'team', unread: 0, lastMessage: 'Parfait, merci!', lastTime: '09:30' },
    { id: '3', name: 'Centre Bell Rénov.', type: 'project', unread: 1, lastMessage: 'Livraison confirmée pour 14h', lastTime: 'Hier' },
    { id: '4', name: 'Marie Dubois', type: 'direct', unread: 0, lastMessage: 'On se voit à la réunion', lastTime: 'Hier' },
    { id: '5', name: 'Urgences SST', type: 'team', unread: 0, lastMessage: 'RAS pour cette semaine', lastTime: 'Lun' },
  ]);

  const [messages] = useState<Message[]>([
    { id: '1', sender: 'Jean Tremblay', content: 'Bonjour équipe! Les plans révisés sont arrivés ce matin.', time: '09:15', isMe: false },
    { id: '2', sender: 'Moi', content: 'Super! Je les ai vus. Il y a quelques modifications au niveau 3.', time: '09:22', isMe: true },
    { id: '3', sender: 'Marie Dubois', content: 'Oui, j\'ai remarqué. On devra ajuster le coffrage.', time: '09:28', isMe: false },
    { id: '4', sender: 'Pierre Martin', content: 'Je peux m\'en occuper cet après-midi avec mon équipe.', time: '09:35', isMe: false },
    { id: '5', sender: 'Moi', content: 'Parfait Pierre. Voici les détails des modifications:', time: '09:40', isMe: true, attachments: [{ name: 'modifications-niveau3.pdf', type: 'pdf' }] },
    { id: '6', sender: 'Jean Tremblay', content: 'Les coffrages sont prêts pour demain', time: '10:45', isMe: false },
  ]);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'project': return <Hash size={18} className="text-gray-400" />;
      case 'team': return <Users size={18} className="text-gray-400" />;
      case 'direct': return <div className="w-5 h-5 rounded-full bg-green-500" />;
      default: return <Hash size={18} className="text-gray-400" />;
    }
  };

  const currentChannel = channels.find(c => c.id === selectedChannel);

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <MessageSquare className="text-blue-600" size={20} />
              Messages
            </h2>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs font-semibold text-gray-500 px-2 py-1">PROJETS</p>
            {channels.filter(c => c.type === 'project').map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left ${
                  selectedChannel === channel.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`}
              >
                {getChannelIcon(channel.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium truncate">{channel.name}</span>
                    <span className="text-xs text-gray-400">{channel.lastTime}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{channel.lastMessage}</p>
                </div>
                {channel.unread > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {channel.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-2">
            <p className="text-xs font-semibold text-gray-500 px-2 py-1">ÉQUIPES</p>
            {channels.filter(c => c.type === 'team').map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left ${
                  selectedChannel === channel.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`}
              >
                {getChannelIcon(channel.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium truncate">{channel.name}</span>
                    <span className="text-xs text-gray-400">{channel.lastTime}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{channel.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="p-2">
            <p className="text-xs font-semibold text-gray-500 px-2 py-1">MESSAGES DIRECTS</p>
            {channels.filter(c => c.type === 'direct').map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left ${
                  selectedChannel === channel.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`}
              >
                {getChannelIcon(channel.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium truncate">{channel.name}</span>
                    <span className="text-xs text-gray-400">{channel.lastTime}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{channel.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 border-b bg-white px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getChannelIcon(currentChannel?.type || 'project')}
            <div>
              <h3 className="font-semibold">{currentChannel?.name}</h3>
              <p className="text-xs text-gray-500">8 membres • 3 en ligne</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg" title="Appel audio">
              <Phone size={18} className="text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg" title="Appel vidéo">
              <Video size={18} className="text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg" title="Épingler">
              <Pin size={18} className="text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg" title="Paramètres">
              <Settings size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.isMe ? 'order-2' : ''}`}>
                {!message.isMe && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                      {message.sender.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-medium">{message.sender}</span>
                    <span className="text-xs text-gray-400">{message.time}</span>
                  </div>
                )}
                <div
                  className={`rounded-lg p-3 ${
                    message.isMe
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border'
                  }`}
                >
                  <p>{message.content}</p>
                  {message.attachments && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((att, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 p-2 rounded ${
                            message.isMe ? 'bg-blue-500' : 'bg-gray-50'
                          }`}
                        >
                          <File size={16} />
                          <span className="text-sm">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {message.isMe && (
                  <div className="text-right mt-1">
                    <span className="text-xs text-gray-400">{message.time}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Paperclip size={20} className="text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Image size={20} className="text-gray-500" />
            </button>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Écrire un message..."
              className="flex-1 border rounded-lg px-4 py-2"
              onKeyPress={(e) => e.key === 'Enter' && messageText && setMessageText('')}
            />
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Smile size={20} className="text-gray-500" />
            </button>
            <button
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={!messageText}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Members */}
      <div className="w-64 bg-white border-l p-4 hidden xl:block">
        <h4 className="font-semibold mb-4">Membres (8)</h4>
        <div className="space-y-3">
          {['Jean Tremblay', 'Marie Dubois', 'Pierre Martin', 'Sophie Lavoie', 'Luc Bergeron'].map((name, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {name.split(' ').map(n => n[0]).join('')}
                </div>
                {i < 3 && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-gray-500">{i < 3 ? 'En ligne' : 'Hors ligne'}</p>
              </div>
            </div>
          ))}
        </div>

        <h4 className="font-semibold mt-6 mb-4">Fichiers partagés</h4>
        <div className="space-y-2">
          {['plans-niveau3.pdf', 'photos-chantier.zip', 'devis-materiel.xlsx'].map((file, i) => (
            <div key={i} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <File size={16} className="text-gray-400" />
              <span className="text-sm truncate">{file}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessagingModule;
