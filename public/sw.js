const PUSH_URL = 'https://functions.poehali.dev/173ba231-42e9-401a-abd7-08cce3063f9d';

self.addEventListener('push', function(event) {
  let data = {};
  try { data = event.data.json(); } catch(e) {}

  const title = data.title || 'Новое объявление';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/', teaser_id: data.teaser_id },
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      if (data.teaser_id) {
        return fetch(PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'impression', teaser_id: data.teaser_id, clicked: false })
        }).catch(() => {});
      }
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  const teaser_id = event.notification.data && event.notification.data.teaser_id;

  if (teaser_id) {
    fetch(PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'impression', teaser_id: teaser_id, clicked: true })
    }).catch(() => {});
  }

  event.waitUntil(clients.openWindow(url));
});
