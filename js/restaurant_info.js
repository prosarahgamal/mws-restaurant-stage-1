let restaurant, reviews;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
  enableRatingStars();
  enableReviewSubmit();
});

/**
 * for the rating stars
 */
const enableRatingStars = () => {
  const starEls = document.querySelectorAll('.star.rating');
    starEls.forEach(star => {
        star.addEventListener('click', function (e) {
            let starEl = e.currentTarget;
            starEl.parentNode.setAttribute('data-stars', starEl.dataset.rating);
        });
    });
};

const enableReviewSubmit = () => {
  const submitBtn = document.querySelector('.review-form button');
  submitBtn.addEventListener('click', (e)=>{
    const review = getReviewFromForm();
    if(review){
      const container = document.querySelector('#reviews-list');
      if (container.childNodes.length === 0) {
        document.querySelector('#reviews-container > h2').style.display = 'none';
        document.querySelector('#reviews-container > p').style.display = 'none';
        const title = document.createElement('h2');
        title.innerHTML = 'Reviews';
        container.appendChild(title);
      }
      container.appendChild(createReviewHTML(review));
      
    }
  });
};

const getReviewFromForm = () => {
  const review = {};
  review.name = document.querySelector('input[name="reviewer-name"]').value;
  review.comments = document.querySelector('textarea[name="review"]').value;
  review.rating = document.querySelector('.stars').getAttribute('data-stars');
  review.date = formatDate();
  if(review.name === '' || review.comments === ''){
    document.querySelector('.form-errors').innerHTML = 'Missing data';
    return;
  }
  document.querySelector('.form-errors').innerHTML = '';
  return review;
}

const formatDate = (seconds = 0) => {
  // format date works for two cases if the date is coming from db then use the passed date 
  // or 
  // added from the review form then use the current date
  let date;
  if(seconds != 0){
    date = new Date(seconds);
  }else{
    date = new Date();
  }
  // Month + 1 because month starts from zero!!!
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoic2FyYWhlaXNhIiwiYSI6ImNqd2l6ZWw2MTBieTM0M281OXI0eXoxYnUifQ.4Pyetq10Yzysjm7zCBndsw',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id)
    .then(restaurant => {
      self.restaurant = restaurant;
      fillRestaurantHTML();
      callback(null, restaurant)
    })
    .catch(err => {
      console.error(err);
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');

  image.className = 'restaurant-img';
  let imageUrl = DBHelper.imageUrlForRestaurant(restaurant) + '.jpg';

  let width = window.outerWidth;
  
  if (width <= 320) {
    imageUrl = imageUrl.replace('large', 'small');
  } else if(width <= 420) {
    imageUrl = imageUrl.replace('large', 'medium');
  }

  image.src = imageUrl;
  image.alt = `${restaurant.name} restaurant image`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  // fetch restaurant reviews
  fetchReviews();
}



/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  if(review.date){
    date.innerHTML = review.date;
  }else{
    date.innerHTML = formatDate(review.updatedAt);
  }
  li.appendChild(date);
  

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const fetchReviews = (id = self.restaurant.id) => {
  DBHelper.fetchReviews(id)
    .then(res => {
      self.reviews = res;
      // fill reviews
      fillReviewsHTML();
    })
    .catch(err => err);
}
