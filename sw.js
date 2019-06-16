self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('restaurant-reviews-static-v1').then(function(cache) {
      return cache.addAll([
        '/',
        'js/main.js',
        'css/styles.css',
        'js/dbhelper.js',
        'js/restaurant_info.js',
        'data/restaurants.json'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open('restaurant-reviews-static-v1').then(function(cache) {
      return cache.match(event.request).then(function(res) {
        if (res) {
          return res;
        }
        return fetch(event.request).then(function(res) {
          cache.put(event.request, res.clone());
          return res;
        });
      });
    })
  );
});
