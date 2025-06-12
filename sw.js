importScripts("https://unpkg.com/workbox-sw@6.5.4/build/workbox-sw.min.js"); 

// Configuración del nombre del caché
workbox.core.setCacheNameDetails({
  prefix: "control-dinero",
  suffix: "v2"
});

// Precache archivos esenciales
workbox.precaching.precacheAndRoute([
  { url: "./", revision: null },
  { url: "./index.html", revision: null },
  { url: "./manifest.json", revision: null },
  { url: "./app.js", revision: null },
  { url: "./style.css", revision: null },
  { url: "./icono.png", revision: null },
  { url: "./chart.min.js", revision: null },
  { url: "./jspdf.umd.min.js", revision: null },
  { url: "./jspdf.plugin.autotable.min.js", revision: null }
]);

// Estrategia para recursos estáticos (JS, CSS, IMG)
workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-resources',
    plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 50, purgeOnQuotaError: true })]
  })
);

// Estrategia para documentos HTML
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'document',
  new workbox.strategies.NetworkFirst({
    cacheName: 'pages',
    plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 10, purgeOnQuotaError: true })]
  })
);

// Manejo de mensajes para actualizar sin recargar
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
