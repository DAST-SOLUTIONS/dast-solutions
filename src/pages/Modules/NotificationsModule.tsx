import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Settings } from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const NotificationsModule: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const [notifications] = useState<Notification[]>([
    { id: '1', type: 'warning', title: 'Retard de livraison', message: 'La livraison de béton pour Tour Deloitte est retardée de 2h', time: 'Il y a 5 min', read: false },
    { id: '2', type: 'success', title: 'Rapport approuvé', message: 'Le rapport RJ-2026-010 a été approuvé par Jean Tremblay', time: 'Il y a 15 min', read: false },
    { id: '3', type: 'info', title: 'Nouvelle tâche assignée', message: 'Vous avez été assigné à "Installation coffrage niveau 4"', time: 'Il y a 1h', read: true },
    { id: '4', type: 'error', title: 'Facture en retard', message: 'La facture FACT-2025-089 est en retard de paiement depuis 14 jours', time: 'Il y a 2h', read: true },
    { id: '5', type: 'info', title: 'Météo défavorable', message: 'Alerte neige prévue demain - possibles ajustements de planning', time: 'Il y a 3h', read: true },
  ]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'error': return <AlertTriangle className="text-red-500" size={20} />;
      default: return <Bell className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-blue-600" />
            Notifications
          </h1>
          <p className="text-gray-600">Alertes et notifications en temps réel</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">
          <Settings size={18} />
          Préférences
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Non lues</p>
          <p className="text-2xl font-bold text-blue-600">{notifications.filter(n => !n.read).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Aujourd'hui</p>
          <p className="text-2xl font-bold">8</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Alertes</p>
          <p className="text-2xl font-bold text-orange-600">2</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Cette semaine</p>
          <p className="text-2xl font-bold">34</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>Toutes</button>
            <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg ${filter === 'unread' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>Non lues</button>
          </div>
          <button className="text-sm text-blue-600 hover:underline">Tout marquer comme lu</button>
        </div>
        <div className="divide-y">
          {notifications.filter(n => filter === 'all' || !n.read).map((notif) => (
            <div key={notif.id} className={`p-4 flex gap-4 hover:bg-gray-50 ${!notif.read ? 'bg-blue-50/50' : ''}`}>
              <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-medium">{notif.title}</h4>
                  <span className="text-sm text-gray-500">{notif.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
              </div>
              {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModule;
