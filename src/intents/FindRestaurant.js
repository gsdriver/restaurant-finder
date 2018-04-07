//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    // Build up our parameter structure from the intent
    const params = buildYelpParameters(this.event.request.intent);
    let error;
    let speech;

    // If they didn't set a location in the request and we don't have one here, we
    // will prompt the user for their current location
    if (!params.location) {
      if (!this.attributes.location) {
        utils.emitResponse(this, null, 'As a new user, please specify your location by saying Set Location.');
        return;
      }
      params.location = this.attributes.location;
    }

    yelp.readRestaurantResults(params, (speechError, speechResponse, speechQuestion, repromptQuestion, restaurantList) => {
      if (restaurantList) {
        this.attributes.lastAction = ((restaurantList.total > 0) && (restaurantList.total <= 5)) ? 'ReadList,0' : 'FindRestaurant';
        this.attributes.lastResponse = restaurantList;
      }

      utils.emitResponse(this, speechError, speechResponse, speechQuestion, repromptQuestion);
    });

    utils.emitResponse(this, null, null, speech, reprompt);
  },
};

// Takes a potential category name and returns the name that
// should be pass to the Yelp API or undefined if no match found
function findCategoryInList(category)
{
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
function addYelpParameter(params, value)
{
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
      'terrible': {field: 'rating', value: '0,2'}
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
function buildYelpParameters(intent)
{
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
  } else if (intent.slots.LocationZIP && intent.slots.LocationZIP.value && intent.slots.LocationZIP.value.length == 5) {
    params.location = intent.slots.LocationZIP.value;
  }

  return params;
}