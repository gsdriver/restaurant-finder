//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');
const yelp = require('../api/Yelp');
const location = require('../api/Location');

module.exports = {
  handleIntent: function() {
    // Build up our parameter structure from the intent
    const params = utils.buildYelpParameters(this.event.request.intent);
    let useDeviceLocation;

    // If we are still in results mode, filter the current parameters
    // if there is no overlap in fields (e.g. they are now saying cheap)
    if ((this.handler.state == 'RESULTS') && this.attributes.lastSearch) {
      let field;
      let newSearch = false;

      for (field in params) {
        if (field) {
          if (this.attributes.lastSearch[field]) {
            // This field was mentioned last time, so it is a new search
            newSearch = true;
          }
        }
      }

      // If it's not a new search, copy over the parameters from the last search
      if (!newSearch) {
        for (field in this.attributes.lastSearch) {
          if (field) {
            params[field] = this.attributes.lastSearch[field];
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
    if (isMe(params.location)) {
      console.log('Location of me being converted to device location');
      useDeviceLocation = true;
    } else if (!params.location) {
      if (this.attributes.lastSearch && this.attributes.lastSearch.location) {
        params.location = this.attributes.lastSearch.location;
      } else {
        useDeviceLocation = true;
      }
    }
    if (useDeviceLocation) {
      location.getDeviceLocation(this, (err, address) => {
        if (address && address.postalCode) {
          params.location = address.postalCode;
          complete(this);
        } else {
          console.log('Device Location: ' + JSON.stringify(address));
          this.response.askForPermissionsConsentCard(['read::alexa:device:all:address:country_and_postal_code']);
          utils.emitResponse(this, null, null, this.t('FIND_LOCATION'), this.t('GENERIC_REPROMPT'));
        }
      });
      return;
    }

    if (params.location) {
      complete(this);
    }

    function complete(context) {
      // OK, let's call Yelp API to get a list of restaurants
      yelp.getRestaurantList(params, (error, restaurantList) => {
        if (restaurantList) {
          context.attributes.lastSearch = params;
          context.attributes.lastResponse = restaurantList;
          utils.readRestaurantResults(context, (speech, reprompt, state) => {
            context.handler.state = state;
            utils.emitResponse(context, null, null, speech, reprompt);
          });
        } else {
          utils.emitResponse(context, error);
        }
      });
    }
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
