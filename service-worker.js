// Service Worker pour GitView
self.addEventListener('install', (event) => {
    console.log('Service Worker installé');
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activé');
});

self.addEventListener('fetch', (event) => {
    // Gérer les requêtes ici si nécessaire
}); 