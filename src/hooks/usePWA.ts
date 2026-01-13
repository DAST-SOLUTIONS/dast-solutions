/**
 * Hook PWA - Gestion du Service Worker et des notifications push
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';

interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  pushSubscription: PushSubscription | null;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    pushSubscription: null
  });
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Enregistrer le Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered');
          setRegistration(reg);

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setStatus(prev => ({ ...prev, isUpdateAvailable: true }));
                }
              });
            }
          });
        })
        .catch((err) => console.error('[PWA] SW registration failed:', err));
    }
  }, []);

  // Détecter si l'app est installable
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setStatus(prev => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setStatus(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setStatus(prev => ({ ...prev, isInstalled: true }));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Détecter le statut online/offline
  useEffect(() => {
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Installer l'application
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setStatus(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      }
      
      deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install error:', error);
      return false;
    }
  }, []);

  // Mettre à jour l'application
  const update = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  // S'abonner aux notifications push
  const subscribeToPush = useCallback(async () => {
    if (!registration || !('PushManager' in window)) {
      console.warn('[PWA] Push not supported');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[PWA] Notification permission denied');
        return null;
      }

      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
      if (!vapidKey) {
        console.warn('[PWA] VAPID key not configured');
        return null;
      }

      // Convertir la clé VAPID en ArrayBuffer
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      // Sauvegarder l'abonnement en base
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await (supabase.from('push_subscriptions').upsert({
          user_id: userData.user.id,
          subscription: JSON.stringify(subscription),
          updated_at: new Date().toISOString()
        } as any) as any);
      }

      setStatus(prev => ({ ...prev, pushSubscription: subscription }));
      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription error:', error);
      return null;
    }
  }, [registration]);

  // Se désabonner des notifications
  const unsubscribeFromPush = useCallback(async () => {
    if (status.pushSubscription) {
      try {
        await status.pushSubscription.unsubscribe();
        
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase.from('push_subscriptions').delete().eq('user_id', userData.user.id);
        }

        setStatus(prev => ({ ...prev, pushSubscription: null }));
        return true;
      } catch (error) {
        console.error('[PWA] Unsubscribe error:', error);
        return false;
      }
    }
    return false;
  }, [status.pushSubscription]);

  // Vérifier l'abonnement existant
  useEffect(() => {
    if (registration) {
      registration.pushManager.getSubscription()
        .then((subscription) => {
          setStatus(prev => ({ ...prev, pushSubscription: subscription }));
        });
    }
  }, [registration]);

  return {
    ...status,
    install,
    update,
    subscribeToPush,
    unsubscribeFromPush,
    registration
  };
}

// Hook pour le mode offline
export function useOfflineStorage() {
  const [pendingCount, setPendingCount] = useState(0);

  const saveForSync = useCallback(async (action: {
    type: string;
    table: string;
    data: any;
    url?: string;
  }) => {
    try {
      const pending = JSON.parse(localStorage.getItem('pending_sync') || '[]');
      pending.push({
        ...action,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('pending_sync', JSON.stringify(pending));
      setPendingCount(pending.length);

      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync?.register('sync-data');
      }
    } catch (error) {
      console.error('[Offline] Save error:', error);
    }
  }, []);

  const syncPending = useCallback(async () => {
    if (!navigator.onLine) return false;

    try {
      const pending = JSON.parse(localStorage.getItem('pending_sync') || '[]');
      
      for (const item of pending) {
        try {
          if (item.type === 'insert') {
            await (supabase.from(item.table).insert(item.data) as any);
          } else if (item.type === 'update') {
            await (supabase.from(item.table).update(item.data).eq('id', item.data.id) as any);
          } else if (item.type === 'delete') {
            await supabase.from(item.table).delete().eq('id', item.data.id);
          }
        } catch (error) {
          console.error('[Offline] Sync item failed:', error);
        }
      }

      localStorage.removeItem('pending_sync');
      setPendingCount(0);
      return true;
    } catch (error) {
      console.error('[Offline] Sync error:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const pending = JSON.parse(localStorage.getItem('pending_sync') || '[]');
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      if (pendingCount > 0) {
        syncPending();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [pendingCount, syncPending]);

  return {
    pendingCount,
    saveForSync,
    syncPending
  };
}

// Helper pour convertir la clé VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default usePWA;
