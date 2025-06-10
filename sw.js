importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");

workbox.core.setCacheNameDetails({prefix: "control-dinero"});
workbox.precaching.precacheAndRoute([
  {url: "/Calcular-facturas/", revision: null},
  {url: "/Calcular-facturas/index.html", revision: null},
  {url: "/Calcular-facturas/manifest.json", revision: null},
  {url: "/Calcular-facturas/sw.js", revision: null},
  {url: "/Calcular-facturas/app.js", revision: null},
  {url: "/Calcular-facturas/styles.css", revision: null},
  {url: "/Calcular-facturas/Icono de calculadora_20250608_150126_0000.jpg", revision: null},
  {url: "https://cdn.jsdelivr.net/npm/chart.js", revision: null}
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
