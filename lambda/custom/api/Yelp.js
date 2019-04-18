/*
 * Source file that connects to Yelp
 */

'use strict';

const https = require('https');
const querystring = require('querystring');

module.exports = {
  getRestaurantList: function(params) {
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
    return sendYelpRequest(urlPath)
    .then((restaurantList) => {
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
        myResult.id = restaurant.id;

        // If there is a rating filter, honor it
        if ((ratingFilter.length != 2) ||
                ((myResult.rating >= ratingFilter[0]) && (myResult.rating <= ratingFilter[1]))) {
            results.restaurants.push(myResult);
        }
      });

      results.total = results.restaurants.length;
      return results;
    }).catch((error) => {
      console.log('Yelp:getRestaurantList error ' + error);
      return undefined;
    });
  },
  businessLookup: function(id) {
    return sendYelpRequest('/v3/businesses/' + id, (error, result) => {
      const myResult = {};

      myResult.image_url = result.image_url;
      myResult.transactions = result.transactions;
      if (result.hours && result.hours[0] && (result.hours[0].is_open_now !== undefined)) {
        myResult.open = result.hours[0].is_open_now ? true : false;
      }
      return myResult;
    }).then((error) => {
      console.log('Yelp:businessLookup error ' + error);
      return undefined;
    });
  },
};

function sendYelpRequest(path) {
  const headers = {'Authorization': 'Bearer ' + process.env.YELPTOKEN};
  const options = {hostname: 'api.yelp.com', port: 443, path: path, method: 'GET', headers: headers};

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode == 200) {
        // Process the response
        let fulltext = '';
        res.on('data', (data) => {
          fulltext += data;
        });
        res.on('end', () => resolve(JSON.parse(fulltext)));
      } else {
        // Sorry, there was an error calling the HTTP endpoint
        reject('Unable to call endpoint');
      }
    });

    req.end();
    req.on('error', (e) => {
      reject(e);
    });
  });
}

function cleanString(str) {
  return str.replace(/&/g, 'and');
}
