/*
 * Source file that connects to Yelp
 */

'use strict';

const https = require('https');
const querystring = require('querystring');

module.exports = {
  getRestaurantList: function(params, callback) {
    let urlPath = '/v3/businesses/search?term=restaurants&limit=50&';
    let field;

    // Actually rating is not a parameter, it's a filter - so strip that out of the URL query
    const yelpParams = {};
    for (field in params) {
      if (field != 'rating') {
        yelpParams[field] = params[field];
      }
    }

    // BUGBUG - Should we do some validation on params?
    urlPath += querystring.stringify(yelpParams);
    sendYelpRequest(urlPath, (error, restaurantList) => {
      if (error) {
        callback(error, null);
      } else {
        // Save fields we care about from Yelp, also note the total number of restaurants
        const results = {total: restaurantList.total, restaurants: []};
        let ratingFilter = [];
        if (params.rating) {
          ratingFilter = params.rating.split(',');
        }

        restaurantList.businesses.forEach((restaurant) => {
          const myResult = {};

          // Convert the phone number to a US number
          if (restaurant.phone && (restaurant.phone.length > 0)) {
            if ((restaurant.phone.length == 12 && (restaurant.phone.indexOf('+1') > -1))) {
              // OK, make it (xxx) xxx-xxxx
              myResult.phone = '(' +
                restaurant.phone.substring(2, 5) + ') ' +
                restaurant.phone.substring(5, 8) + '-' +
                restaurant.phone.substring(8, 12);
            } else {
              // Just use this
              myResult.phone = restaurant.phone;
            }
          }

          // Set the location fields that we need
          if (restaurant.location) {
            myResult.location = {};
            myResult.location.address1 =
              (restaurant.location.address1 && restaurant.location.address1.length)
              ? cleanString(restaurant.location.address1) : undefined;
            myResult.location.city =
              (restaurant.location.city && restaurant.location.city.length)
              ? cleanString(restaurant.location.city) : undefined;
            myResult.location.display_address = restaurant.location.display_address;
          }

          myResult.name = cleanString(restaurant.name);
          myResult.rating = restaurant.rating;
          myResult.review_count = restaurant.review_count;
          myResult.is_closed = restaurant.is_closed;
          myResult.price = (restaurant.price) ? Math.min(restaurant.price.length, 4) : 0;
          myResult.distance = restaurant.distance;
          myResult.url = restaurant.url;
          myResult.id = restaurant.id;

          // If there is a rating filter, honor it
          if ((ratingFilter.length != 2) ||
                  ((myResult.rating >= ratingFilter[0]) && (myResult.rating <= ratingFilter[1]))) {
              results.restaurants.push(myResult);
          }
        });

        results.total = results.restaurants.length;
        callback(error, results);
      }
    });
  },
  businessLookup: function(id, callback) {
    sendYelpRequest('/v3/businesses/' + id, (error, result) => {
      if (error) {
        callback(error, null);
      } else {
        const myResult = {};

        myResult.image_url = result.image_url;
        callback(error, myResult);
      }
    });
  },
};

function sendYelpRequest(path, callback) {
  const headers = {'Authorization': 'Bearer ' + process.env.YELPTOKEN};
  const options = {hostname: 'api.yelp.com', port: 443, path: path, method: 'GET', headers: headers};

  const req = https.request(options, (res) => {
    if (res.statusCode == 200) {
      // Process the response
      let fulltext = '';
      res.on('data', (data) => {
        fulltext += data;
      });
      res.on('end', () => callback(null, JSON.parse(fulltext)));
    } else {
      // Sorry, there was an error calling the HTTP endpoint
      callback('Unable to call endpoint', null);
    }
  });

  req.end();
  req.on('error', (e) => {
    callback(e, null);
  });
}

function cleanString(str) {
  return str.replace(/&/g, 'and');
}
