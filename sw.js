importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"); 

// Configuración básica del caché
workbox.core.setCacheNameDetails({
  prefix: "control-dinero",
  suffix: "v2"
});

// Precache archivos esenciales (relativas)
workbox.precaching.precacheAndRoute([
  { url: "./", revision: null },
  { url: "./index.html", revision: null },
  { url: "./manifest.json", revision: null },
  { url: "./app.js", revision: null },
  { url: "./style.css", revision: null },
  { url: "./Icono de calculadora_20250608_150126_0000.jpg", revision: null },
  { url: "./chart.min.js", revision: null },          // Chart.js local
  { url: "./jspdf.umd.min.js", revision: null },     // jsPDF local
  { url: "./jspdf.plugin.autotable.min.js", revision: null } // autoTable local
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
