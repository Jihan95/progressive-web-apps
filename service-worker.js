self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('todo-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles/style.css',
        '/scripts/app.js',
      ]);
    })
  );
});

self.addEventListener('install', event => {
    console.log('Service worker installed');
});

self.addEventListener('activate', event => {
    console.log('Service worker activated');
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

