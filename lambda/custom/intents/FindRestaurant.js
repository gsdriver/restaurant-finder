//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');
const yelp = require('../api/Yelp');
const location = require('../api/Location');
const ReadList = require('./ReadList');
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

    // If this was a new session, then start by clearing the last search
    if (handlerInput.requestEnvelope.session.new) {
      attributes.state = undefined;
      attributes.lastSearch = undefined;
      attributes.lastResponse = undefined;
    }

    // Build up our parameter structure from the intent
    const params = utils.buildYelpParameters(event.request.intent);
    let useDeviceLocation;

    if (event.request.intent.name === 'FindRestaurantNearbyIntent') {
      useDeviceLocation = true;
    } else {
      // If we are still in results mode, filter the current parameters
      // if there is no overlap in fields (e.g. they are now saying cheap)
      if (attributes.lastYelpSearch) {
        let field;
        let newSearch = false;

        for (field in params.yelpParams) {
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
              params.yelpParams[field] = attributes.lastYelpSearch[field];
            }
          }
          for (field in attributes.lastSearch) {
            if (field) {
              params.searchParams[field] = attributes.lastSearch[field];
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
      if (isMe(params.yelpParams.location)) {
        console.log('Location of me being converted to device location');
        useDeviceLocation = true;
      } else if (!params.yelpParams.location) {
        if (attributes.lastYelpSearch && attributes.lastYelpSearch.location) {
          params.yelpParams.location = attributes.lastYelpSearch.location;
          if (attributes.lastSearch && attributes.lastSearch.location) {
            params.searchParams.location = attributes.lastSearch.location;
          }
        } else {
          useDeviceLocation = true;
        }
      }
    }

    if (useDeviceLocation) {
      if (event.context && event.context.Geolocation && event.context.Geolocation.coordinate) {
        // We have a lat/long that we can use
        params.yelpParams.location = undefined;
        params.yelpParams.latitude = event.context.Geolocation.coordinate.latitudeInDegrees;
        params.yelpParams.longitude = event.context.Geolocation.coordinate.longitudeInDegrees;
        params.yelpParams.sort_by = 'distance';
        params.searchParams.location = undefined;
        params.searchParams.latitude = params.yelpParams.latitude;
        params.searchParams.longitude = params.yelpParams.longitude;
        promise = Promise.resolve(params);
      } else if (event.context && event.context.System &&
        event.context.System.device &&
        event.context.System.device.supportedInterfaces &&
        event.context.System.device.supportedInterfaces.Geolocation) {
        // The device supports providing lat/long, so let's ask for it
        attributes.lastSearch = params.searchParams;
        attributes.lastYelpSearch = params.yelpParams;
        return handlerInput.jrb
          .speak(ri('FIND_GEOLOCATION'), true)
          .withAskForPermissionsConsentCard(['alexa::devices:all:geolocation:read'])
          .getResponse();
      } else {
        // The device doesn't support geolocation, so let's use postal code instead
        promise = location.getDeviceLocation(handlerInput)
        .then((address) => {
          params.yelpParams.location = address.postalCode;
          return params;
        }).catch((err) => {
          attributes.lastSearch = params.searchParams;
          attributes.lastYelpSearch = params.yelpParams;

          // OK, they don't have a geolocation
          return handlerInput.jrb
            .speak(ri('FIND_LOCATION'), true)
            .withAskForPermissionsConsentCard(['read::alexa:device:all:address:country_and_postal_code'])
            .getResponse();
        });
      }
    } else {
      promise = Promise.resolve(params);
    }

    return promise.then((params) => {
      // OK, let's call Yelp API to get a list of restaurants
      if ((typeof params === 'object') && params.yelpParams &&
        (params.yelpParams.location ||
        (params.yelpParams.latitude && params.yelpParams.longitude))) {
        return yelp.getRestaurantList(params.yelpParams)
        .then((restaurantList) => {
          // Save details of the search and results
          attributes.lastSearch = params.searchParams;
          attributes.lastYelpSearch = params.yelpParams;
          attributes.lastResponse = restaurantList;

          // If this was an automotive lat/long search, filter
          // to results within three miles and start reading the list
          // Make sure there is at least one response, even if more than 3 miles away
          if (attributes.isAuto && params.yelpParams.latitude && params.yelpParams.longitude) {
            attributes.lastResponse.restaurants = restaurantList.restaurants.filter((item) => {
              return (utils.distanceBetweenPoints(params.yelpParams.latitude,
                params.yelpParams.longitude,
                item.latitude, item.longitude, true) <= 3.0);
            });
            if (attributes.lastResponse.restaurants.length === 0) {
              attributes.lastResponse.restaurants = restaurantList.restaurants.slice(0, 1);
            }
            attributes.lastResponse.total = attributes.lastResponse.restaurants.length;

            if (!attributes.lastResponse || !attributes.lastResponse.restaurants
              || !attributes.lastResponse.restaurants.length) {
              attributes.state = '';
              return handlerInput.jrm.renderBatch([
                ri('RESULTS_NORESULTS', {RestaurantText: text}),
                ri('Jargon.DefaultReprompt'),
              ]);
            } else {
              return ReadList.handle(handlerInput);
            }
          } else {
            return utils.readRestaurantResults(handlerInput)
            .then((result) => {
              attributes.state = result.state;
              return handlerInput.responseBuilder
                .speak(result.speech)
                .reprompt(result.reprompt)
                .getResponse();
            });
          }
        }).catch((error) => {
          console.log(error.stack);
          return handlerInput.jrb
            .speak(ri('SKILL_ERROR'))
            .withShouldEndSession(true)
            .getResponse();
        });
      } else {
        // It was already a response - pass it on
        return params;
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
