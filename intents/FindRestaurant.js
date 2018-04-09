//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');
const categoryList = require('../categories');
const yelp = require('../api/Yelp');
const location = require('../api/Location');

module.exports = {
  handleIntent: function() {
    // Build up our parameter structure from the intent
    const params = buildYelpParameters(this.event.request.intent);

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
    // 1) They specified one in the request
    // 2) The location they used with the last search
    // 3) The device location (we'll need to ask permission in their app)
    if (!params.location) {
      if (this.attributes.lastSearch && this.attributes.lastSearch.location) {
        params.location = this.attributes.lastSearch.location;
      } else {
        location.getDeviceLocation(this, (err, address) => {
          if (address && address.postalCode) {
            params.location = address.postalCode;
            complete(this);
          } else {
            console.log('Device Location: ' + JSON.stringify(address));
            this.response.askForPermissionsConsentCard(['read::alexa:device:all:address:country_and_postal_code']);
            utils.emitResponse(this, null, this.t('FIND_LOCATION'));
          }
        });
        return;
      }
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

// Takes a potential category name and returns the name that
// should be pass to the Yelp API or undefined if no match found
function findCategoryInList(category) {
  let i;
  let alias;

  for (i = 0; i < categoryList.length; i++) {
    if (category == categoryList[i].alias.toLowerCase()
        || (category == categoryList[i].title.toLowerCase())) {
      // This is it - use the alias
      alias = categoryList[i].alias;
      break;
    }
  }

  return alias;
}

// Takes a value and fits it into the appropriate Yelp parameter
function addYelpParameter(params, value) {
  const category = findCategoryInList(value);
  const mapping = {
      'open': {field: 'open_now', value: true},
      'open now': {field: 'open_now', value: true},
      'cheap': {field: 'price', value: '1'},
      'moderate': {field: 'price', value: '2'},
      'spendy': {field: 'price', value: '3'},
      'splurge': {field: 'price', value: '4'},
      'inexpensive': {field: 'price', value: '1,2'},
      'expensive': {field: 'price', value: '3,4'},
      'costly': {field: 'price', value: '4'},
      'pricey': {field: 'price', value: '3,4'},
      'good': {field: 'rating', value: '3,5'},
      'great': {field: 'rating', value: '4,5'},
      'bad': {field: 'rating', value: '0,2.5'},
      'terrible': {field: 'rating', value: '0,2'},
  };

  if (category) {
    // OK, this matches a category
    if (params.categories) {
      params.categories += (',' + category);
    } else {
      params.categories = category;
    }
  } else if (mapping[value]) {
    params[mapping[value].field] = mapping[value].value;
  }
}

// Builds a structure to pass to the Yelp API
function buildYelpParameters(intent) {
  const params = {};

  // You can have up to three intent slots - first let's see if we have a category
  if (intent.slots.FirstDescriptor && intent.slots.FirstDescriptor.value) {
    addYelpParameter(params, intent.slots.FirstDescriptor.value.toLowerCase());
  }
  if (intent.slots.SecondDescriptor && intent.slots.SecondDescriptor.value) {
    addYelpParameter(params, intent.slots.SecondDescriptor.value.toLowerCase());
  }
  if (intent.slots.ThirdDescriptor && intent.slots.ThirdDescriptor.value) {
    addYelpParameter(params, intent.slots.ThirdDescriptor.value.toLowerCase());
  }
  if (intent.slots.Location && intent.slots.Location.value) {
    params.location = intent.slots.Location.value;
  } else if (intent.slots.LocationZIP && intent.slots.LocationZIP.value
      && intent.slots.LocationZIP.value.length == 5) {
    params.location = intent.slots.LocationZIP.value;
  }

  return params;
}
