importScripts('js/idb.js');

const staticCacheName = 'restaurant-reviews-static-v13';
const contentImgsCache = 'restaurant-reviews-content-imgs';

const openDatabase = () => {
  return idb.open('restaurant-reviews', 1, (upgradeDb) => {
    const store = upgradeDb.createObjectStore('restaurants', {
      keyPath: 'id'
    });
    const reviews = upgradeDb.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
    reviews.createIndex('restaurant_id', 'restaurant_id', { unique: false });
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
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
        'http://localhost:8000/manifest.json'
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
    const params = new URLSearchParams(requestUrl.search);
    if(params.get('is_favorite')){
      event.respondWith(favoriteRestaurant(event.request));
      return;
    }
    event.respondWith(serveRestaurants(event.request));
    return;
  }

  if (requestUrl.pathname.startsWith('/reviews')) {
    event.respondWith(serveReviews(event.request));
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
      if (restaurants.length > 0) {
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
              const blob = new Blob(networkRes, { type: 'application/json' });
              const init = { "status": 200, "statusText": "SuperSmashingGreat!" };
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

const serveReviews = (request) => {
  // get id from request
  const restaurantId = +request.url.replace('http://localhost:1337/reviews/?restaurant_id=', '');
  const dbPromise = openDatabase();
  return dbPromise.then(db => {
    if (!db) return;
    const tx = db.transaction('reviews');
    const reviewsStore = tx.objectStore('reviews');
    return reviewsStore.index('restaurant_id').getAll(restaurantId);
  })
    .then(reviews => {
      // check if there is reviews in db
      if (reviews.length > 0) {
        // if yes return them
        let response = new Response(JSON.stringify(reviews), {
          headers: new Headers({
            'Content-type': 'application/json'
          }),
          status: 200
        });
        return response;
      }
      return fetch(request)
        .then(res => {
          // add the reviews to db then return them
          addReviewsToDb(dbPromise, res.clone());
          return res;
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

const addReviewsToDb = (dbPromise, res) => {
  res.json()
    .then(networkRes => {
      dbPromise.then(db => {
        const tx = db.transaction('reviews', 'readwrite');
        const reviewsStore = tx.objectStore('reviews');
        networkRes.forEach(o => {
          delete o.id;
          reviewsStore.put(o);
        });
      })
    })
    .catch(err => {
      console.log('error while adding to db ' + err);
    })
}

self.addEventListener('sync', event => {
  if (event.tag === 'sync-reviews') {
    event.waitUntil(sendDataToServer());
  }
});

const sendDataToServer = () => {
  const dbPromise = openDatabase();
  return dbPromise.then(db => {
    const reviewsStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
    return reviewsStore.getAll();
  })
  .then(reviews => {
    reviews.forEach(review => {
      if(review.hasOwnProperty('isSync') && review.isSync === false){
        // we don't need isSync anymore
        delete review.isSync;
        // for the fetch post request we need to delete date and id properties from review object 
        // but we still need them to update the object in idb 
        // so we need a to clone the object
        const body = Object.assign({}, review);
        delete body.id;
        delete body.date;

        // now let's post the object
        return fetch('http://localhost:1337/reviews/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })
        .then(res => {
          // update the review in db as it doesn't need to be synced anymore
          return dbPromise.then(db => {
            const reviewsStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
            return reviewsStore.put(review);
          })
          .then(res => {
            console.log('object updated in db');
          })
          .catch(err => {
            console.log('error while updating db ' + err);
          })
        })
        .catch(err => {
          console.log('error while syncing ' + err);
        })
      }
    });
  })
  .catch(err => {
    console.log('error while getting reviews from db ' + err);
  })
}

const favoriteRestaurant = (request) => {
  return fetch(request)
  .then(res => res)
  .catch(err => err)
}
