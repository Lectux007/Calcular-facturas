importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");

workbox.core.setCacheNameDetails({prefix: "control-dinero"});
workbox.precaching.precacheAndRoute([
  {url: "/", revision: null},
  {url: "/index.html", revision: null},
  {url: "/manifest.json", revision: null},
  {url: "/sw.js", revision: null},
  {url: "/Icono de calculadora_20250608_150126_0000.jpg", revision: null},
  // Agrega aquí otros archivos si tienes (css, js, imágenes, etc.)
]);

// Cacheo de scripts, estilos, imágenes
workbox.routing.registerRoute(
  ({request}) => request.destination === 'script' ||
                 request.destination === 'style' ||
                 request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-resources',
    plugins: [new workbox.expiration.ExpirationPlugin({maxEntries: 50})]
  })
);

// Cacheo de páginas HTML
workbox.routing.registerRoute(
  ({request}) => request.destination === 'document',
  new workbox.strategies.NetworkFirst({
    cacheName: 'pages',
    plugins: [new workbox.expiration.ExpirationPlugin({maxEntries: 10})]
  })
);

// Permitir actualización inmediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});