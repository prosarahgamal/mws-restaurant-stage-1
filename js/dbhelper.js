/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return new Promise((resolve, reject) => {
      fetch(DBHelper.DATABASE_URL)
      .then(res => res.json())
      .then(res => resolve(res))
      .catch(err => reject(err));
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
  return new Promise((resolve, reject)=>{
    DBHelper.fetchRestaurants()
    .then(res => {
      const restaurant = res.find(r => r.id == id);
      if (restaurant) { // Got the restaurant
        resolve(restaurant);
      } else { // Restaurant does not exist in the database
        resolve('Restaurant does not exist');
      }
    })
    .catch(err => reject(err));
  });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    return new Promise((resolve, reject) => {
      DBHelper.fetchRestaurants()
      .then(res => {
        resolve(res.filter(r => r.cuisine_type == cuisine));
      })
      .catch(err => reject(err));
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    return new Promise((resolve, reject) => {
      DBHelper.fetchRestaurants()
      .then(res => {
        resolve(res.filter(r => r.neighborhood == neighborhood));
      })
      .catch(err => reject(err));
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
      return new Promise((resolve, reject) => {
        DBHelper.fetchRestaurants()
        .then(res => {
          if (cuisine != 'all') { // filter by cuisine
          res = res.filter(r => r.cuisine_type == cuisine);
          }
          if (neighborhood != 'all') { // filter by neighborhood
            res = res.filter(r => r.neighborhood == neighborhood);
          }
          resolve(res);
        })
        .catch(err => reject(err))
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    return new Promise((resolve, reject) => {
      DBHelper.fetchRestaurants()
      .then(res => {
        const neighborhoods = res.map((v, i) => res[i].neighborhood);
        resolve(neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i));
      })
      .catch(err => reject(err));
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    return new Promise((resolve, reject) => {
      DBHelper.fetchRestaurants()
      .then(res => {
        const cuisines = res.map((v, i) => res[i].cuisine_type);
        resolve(cuisines.filter((v, i) => cuisines.indexOf(v) == i));
      })
      .catch(err => reject(err));
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `./img-res/large/${restaurant.photograph}`;
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
}
