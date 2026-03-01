// ===============================
// NOM & VERSION DU CACHE
// ===============================
const CACHE_NAME = "nacc-budget-v1";

// ===============================
// FICHIERS À METTRE EN CACHE
// ===============================
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// ===============================
// INSTALLATION DU SERVICE WORKER
// ===============================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Cache ouvert");
        return cache.addAll(urlsToCache);
      })
  );
});

// ===============================
// ACTIVATION (SUPPRIME ANCIENS CACHES)
// ===============================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log("Ancien cache supprimé");
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// ===============================
// INTERCEPTION DES REQUÊTES
// ===============================
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si trouvé dans le cache → on renvoie
        if (response) {
          return response;
        }

        // Sinon → on va chercher sur internet
        return fetch(event.request)
          .then(networkResponse => {
            return networkResponse;
          })
          .catch(() => {
            console.log("Erreur réseau");
          });
      })
  );
});