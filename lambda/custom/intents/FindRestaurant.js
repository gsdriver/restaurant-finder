//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');
const yelp = require('../api/Yelp');
const location = require('../api/Location');
const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') &&
      ((request.intent.name === 'FindRestaurantIntent') ||
       (request.intent.name === 'FindRestaurantNearbyIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let promise;

    // Build up our parameter structure from the intent
    const params = utils.buildYelpParameters(event.request.intent);
    const yelpParams = params.yelpParams;
    const searchParams = params.searchParams;
    let useDeviceLocation;

    if (event.request.intent.name === 'FindRestaurantNearbyIntent') {
      useDeviceLocation = true;
    } else {
      // If we are still in results mode, filter the current parameters
      // if there is no overlap in fields (e.g. they are now saying cheap)
      if (attributes.lastYelpSearch) {
        let field;
        let newSearch = false;

        for (field in yelpParams) {
          if (field) {
            if (attributes.lastYelpSearch[field]) {
              // This field was mentioned last time, so it is a new search
              newSearch = true;
            }
          }
        }

        // If it's not a new search, copy over the parameters from the last search
        if (!newSearch) {
          for (field in attributes.lastYelpSearch) {
            if (field) {
              yelpParams[field] = attributes.lastYelpSearch[field];
            }
          }
          for (field in attributes.lastSearch) {
            if (field) {
              searchParams[field] = attributes.lastSearch[field];
            }
          }
        }
      }

      // Find a location in the following order:
      //   1) They specified one in the request
      //   2) The location they used with the last search
      //   3) The device location (we'll need to ask permission in their app)
      // If the location is me then we'll assume that they are looking near
      // their location (not Maine), and will go directly to the device location
      if (isMe(yelpParams.location)) {
        console.log('Location of me being converted to device location');
        useDeviceLocation = true;
      } else if (!yelpParams.location) {
        if (attributes.lastYelpSearch && attributes.lastYelpSearch.location) {
          yelpParams.location = attributes.lastYelpSearch.location;
          if (attributes.lastSearch && attributes.lastSearch.location) {
            searchParams.location = attributes.lastSearch.location;
          }
        } else {
          useDeviceLocation = true;
        }
      }
    }

    if (useDeviceLocation) {
      // First let's see if we can get lat/long
      if (event.context && event.context.System && event.context.Geolocation &&
        event.context.System.device &&
        event.context.System.device.supportedInterfaces &&
        event.context.System.device.supportedInterfaces.Geolocation) {
        // Great, let's get it
        yelpParams.location = undefined;
        yelpParams.latitude = event.context.Geolocation.coordinate.latitudeInDegrees;
        yelpParams.longitude = event.context.Geolocation.coordinate.longitudeInDegrees;
        yelpParams.sort_by = 'distance';
        searchParams.location = undefined;
        searchParams.latitude = yelpParams.latitude;
        searchParams.longitude = yelpParams.longitude;
        promise = Promise.resolve(params);
      } else {
        // Nope - let's see if we can get postal code instead
        promise = location.getDeviceLocation(handlerInput)
        .then((address) => {
          if (address && address.postalCode) {
            yelpParams.location = address.postalCode;
            return params;
          } else {
            attributes.lastSearch = params.searchParams;
            attributes.lastYelpSearch = params.yelpParams;
            return handlerInput.jrb
              .speak(ri('FIND_LOCATION'), true)
              .withAskForPermissionsConsentCard(['read::alexa:device:all:address:country_and_postal_code']);
          }
        });
      }
    } else {
      promise = Promise.resolve(params);
    }

    return promise.then((params) => {
      // OK, let's call Yelp API to get a list of restaurants
      if ((typeof params === 'object') &&
        (params.yelpParams.location || (params.yelpParams.latitude && params.yelpParams.longitude))) {
        return yelp.getRestaurantList(params.yelpParams)
        .then((restaurantList) => {
          // If this was an automotive lat/long search, filter
          // to results within two miles
          if (attributes.isAuto && params.yelpParams.latitude && params.yelpParams.longitude) {
            restaurantList.restaurants = restaurantList.restaurants.filter((item) => {
              return (distanceBetweenPoints(params.yelpParams.latitude, params.yelpParams.longitude, item.latitude, item.longitude) <= 2.0)
            });
            restaurantList.total = restaurantList.restaurants.length;
          }

          // Save details of the search and results
          attributes.lastSearch = params.searchParams;
          attributes.lastYelpSearch = params.yelpParams;
          attributes.lastResponse = restaurantList;
          return utils.readRestaurantResults(handlerInput)
          .then((result) => {
            attributes.state = result.state;
            return handlerInput.responseBuilder
              .speak(result.speech)
              .reprompt(result.reprompt)
              .getResponse();
          });
        }).catch((error) => {
          console.log(error.stack);
          return handlerInput.jrb
            .speak(ri('SKILL_ERROR'))
            .getResponse();
        });
      }
    });
  },
};

function isMe(location) {
  if (!location) {
    return false;
  }

  const loc = location.toLowerCase();

  // Does it contain the word me?
  if (loc === 'me') {
    return true;
  }
  if (loc.indexOf(' me ') > -1) {
    return true;
  }
  if (loc.indexOf(' me') == loc.length - 3) {
    return true;
  }

  // What about my (not at the end of the string)?
  if (loc.indexOf(' my ') > -1) {
    return true;
  }
  if (loc.substring(0, 3) == 'my ') {
    return true;
  }

  return false;
}

// Calculate the distance between two lat/long points in miles
function distanceBetweenPoints(lat1, long1, lat2, long2) {
  const earthRadius = 3959;
  const dLat = deg2rad(lat2 - lat1);
  const dLong = deg2rad(long2 - long1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (earthRadius * c);
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}
