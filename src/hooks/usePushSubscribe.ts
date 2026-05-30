import { useEffect } from "react";

const SITES_URL = 'https://functions.poehali.dev/41ca0f1c-9ba7-4dde-8961-779ab034a1fc';
const PUSH_URL = 'https://functions.poehali.dev/173ba231-42e9-401a-abd7-08cce3063f9d';
const DIRECT_TOKEN = 'tizerpro-direct-token-main-site-2024';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushSubscribe() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (localStorage.getItem('push_subscribed')) return;

    const subscribe = async () => {
      try {
        const vapidRes = await fetch(PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'vapid_key' }),
        });
        const { public_key } = await vapidRes.json();
        if (!public_key) return;

        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(public_key),
        });

        const subJson = sub.toJSON();
        await fetch(SITES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'subscribe',
            token: DIRECT_TOKEN,
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh || '',
            auth: subJson.keys?.auth || '',
            browser: navigator.userAgent.includes('Firefox') ? 'firefox' : 'chrome',
          }),
        });

        localStorage.setItem('push_subscribed', '1');
      } catch (_) { /* подписка не удалась */ }
    };

    // Небольшая задержка чтобы не мешать загрузке страницы
    const timer = setTimeout(subscribe, 3000);
    return () => clearTimeout(timer);
  }, []);
}