importScripts('js/idb.js');

const staticCacheName = 'restaurant-reviews-static-v13';
const contentImgsCache = 'restaurant-reviews-content-imgs';

const openDatabase = () => {
  return idb.open('restaurant-reviews', 1, (upgradeDb) => {
    const store = upgradeDb.createObjectStore('restaurants', {
      keyPath: 'id'
    });
  });
};

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(staticCacheName)
      .then(cache => cache.addAll([
        '/',
        './index.html',
        './restaurant.html',
        './css/styles.css',
        './js/dbhelper.js',
        './js/main.js',
        './js/restaurant_info.js',
        './favicon.ico',
        'https://cdn.rawgit.com/mozilla/localForage/master/dist/localforage.js',
        '/js/idb.js',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
      ]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.startsWith('/img-res/')) {
    event.respondWith(servePhoto(event.request));
    return;
  }

  if (requestUrl.pathname.startsWith('/restaurants')) {
    event.respondWith(serveRestaurants(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(response => {
      if (response) return response;
      return fetch(event.request).then(function (networkRes) {
        return networkRes;
      })
      .catch(err => console.log('error ' + err));
    }).catch(err => console.log(err))
  );
});

const servePhoto = (request) => {
  const storageUrl = request.url.replace(/large\/|medium\/|small\//, '');
  return caches.open(contentImgsCache)
    .then(cache => {
      return cache.match(storageUrl)
        .then(res => {
          if (res) return res;
          return fetch(request)
            .then(networkRes => {
              cache.put(storageUrl, networkRes.clone());
              return networkRes;
            })
        })
    });
}

const serveRestaurants = (request) => {
  const dbPromise = openDatabase();
    return dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('restaurants');
      const restaurantStore = tx.objectStore('restaurants');
      return restaurantStore.getAll();
    })
    .then(restaurants => {
      if(restaurants.length > 0){
        let response = new Response(JSON.stringify(restaurants), {
          headers: new Headers({
            'Content-type': 'application/json'
          }),
          status: 200
        });
        return response;
      }
      return fetch(request)
      .then(res => res.json())
      .then(networkRes => {
        dbPromise.then(db => {
          const tx = db.transaction('restaurants', 'readwrite');
          const restaurantStore = tx.objectStore('restaurants');
          networkRes.forEach(o => restaurantStore.put(o));
          return tx.complete;
        })
        .then(() => {
          const blob = new Blob(networkRes, {type : 'application/json'});
          const init = { "status" : 200 , "statusText" : "SuperSmashingGreat!" };
          const response = new Response(blob, init);
          return response;
        })
        .catch(err => {
          console.log('error while adding to db ' + err);
        })
      })
      .catch(err => {
        console.log('error while fetching data from network ' + err);
      })
    })
    .catch(err => {
      console.log('error while fetching data from db ' + err);
    })
}

self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
