//
// Utility functionals
//

const categoryList = require('./categories');
const yelp = require('./api/Yelp');
const geocahe = require('./api/Geocache');
const LIST_LENGTH = 5;
const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  PAGE_SIZE: LIST_LENGTH,
  clearState: function(context) {
    context.handler.state = '';
    delete context.attributes['STATE'];
    context.attributes.lastSearch = undefined;
    context.attributes.lastResponse = undefined;
  },
  readRestaurantResults: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let speech;
    let reprompt;
    let state;

    return paramsToText(handlerInput, false)
    .then((text) => {
      // If there are more than five results, prompt the user to filter further
      if (!attributes.lastResponse || !attributes.lastResponse.restaurants
        || !attributes.lastResponse.restaurants.length) {
        state = '';
        return handlerInput.jrm.renderBatch([
          ri('RESULT_NORESULTS', {RestaurantText: text}),
          ri('Jargon.DefaultReprompt'),
        ]);
      } else if (attributes.lastResponse.total > LIST_LENGTH) {
        state = 'RESULTS';
        let speech;

        return handlerInput.jrm
          .render(ri('RESULTS_RESULTS', {Total: attributes.lastResponse.total, RestaurantText: text}))
        .then((text) => {
          // More than two pages of results?  Suggest a filter
          speech = text;
          if (attributes.lastResponse.total > 2 * LIST_LENGTH) {
            if (!attributes.lastSearch.price
              || !attributes.lastSearch.categories
              || !attributes.lastSearch.rating) {
              let option;
              if (!attributes.lastSearch.categories) {
                option = 'RESULTS_FILTER_CUISINE';
              } else if (!attributes.lastSearch.rating) {
                option = 'RESULTS_FILTER_RATING';
              } else {
                option = 'RESULTS_FILTER_PRICE';
              }
              return handlerInput.jrm.render(ri(option));
              reprompt += context.t('RESULTS_FILTER').replace('{0}', option);
            } else {
              return Promise.resolve();
            }
          } else {
            return Promise.resolve();
          }
        }).then((condition) => {
          if (condition) {
            reprompt = 'RESULTS_FILTER';
          } else {
            reprompt = 'RESULTS_REPROMPT';
          }
          return handlerInput.jrm.render(ri(reprompt, {Condition: condition}));
        }).then((text) => {
          return [speech + text, text];
        });
      } else {
        state = 'LIST';
        attributes.lastResponse.read = 0;
        return handlerInput.jrm.renderBatch([
          ri('RESULTS_RESULTS', {Total: attributes.lastResponse.total, RestaurantText: text}),
          ri('RESULTS_DETAILS'),
        ]).then((results) => {
          let i;
          for (i = 0; i < attributes.lastResponse.restaurants.length; i++) {
            results[0] += (' ' + (i + 1) + ' <break time=\"200ms\"/> ');
            results[0] += attributes.lastResponse.restaurants[i].name + '.';
          }
          results[0] += (' ' + results[1]);
          return results;
        });
      }
    }).then((results) => {
      return {speech: results[0], reprompt: results[1], state: state};
    });
  },
  readRestaurantsFromList: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let speech;
    let reprompt;
    const restaurantList = attributes.lastResponse;
    const toRead = Math.min(restaurantList.restaurants.length - restaurantList.read, LIST_LENGTH);
    let restaurants = '';

    let i;
    for (i = 0; i < toRead; i++) {
      restaurants += (' ' + (i + 1) + ' <break time=\"200ms\"/> ' + restaurantList.restaurants[restaurantList.read + i].name + '.');
    }

    // OK, read the names as allow them to ask for more detail on any choice
    speech = 'READLIST_RESULTS';
    reprompt = 'RESULTS_DETAILS';
    if (restaurantList.restaurants.length - restaurantList.read > LIST_LENGTH) {
      speech += '_MORE';
      reprompt += '_MORE';
    }

    return handlerInput.jrm.renderBatch([
      ri(speech, {Total: toRead, Restaurants: restaurants}),
      ri(reprompt),
    ]).then((results) => {
      return {speech: results[0], reprompt: results[1]};
    });
  },
  readRestaurantDetails: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const restaurantList = attributes.lastResponse;
    const restaurant = restaurantList.restaurants[restaurantList.details];
    const priceList = ['DETAILS_PRICE_CHEAP', 'DETAILS_PRICE_MODERATE',
          'DETAILS_PRICE_SPENDY', 'DETAILS_PRICE_SPLURGE'];
    let speech = '';
    let cardText = '';
    let imageUrl;
    let business;

    return yelp.businessLookup(restaurant.id)
    .then((result) => {
      business = result;
      imageUrl = (business) ? business.image_url : undefined;
      const renderItems = [];

      // Read information about the restaurant
      renderItems.push(ri('DETAILS_LOCATION', {
        Name: restaurant.name,
        Address: restaurant.location.address1,
        City: restaurant.location.city,
      }));

      if (restaurant.phone) {
        renderItems.push(ri('DETAILS_PHONE', {Phone: restaurant.phone}));
      }
      if (business) {
        if (business.open !== undefined) {
          renderItems.push(ri('DETAILS_OPERATING', {
            Status: ri(business.open ? 'DETAILS_OPEN' : 'DETAILS_CLOSED'),
          }));
        }
      }

      renderItems.push(ri('DETAILS_SEECARD'));
      return handlerInput.jrm.renderBatch(renderItems);
    }).then((items) => {
      const renderItems = [];
      items.forEach((item) => {
        speech += item;
      });

      // And set up the card
      if (restaurant.location.display_address) {
        restaurant.location.display_address.forEach((address) => {
          cardText += (address + '\n');
        });
      } else {
        cardText += restaurant.location.address1 + '\n';
        cardText += restaurant.location.city + '\n';
      }
      renderItems.push(ri('DETAILS_CARD_YELP', {
        Rating: restaurant.rating,
        Count: restaurant.review_count,
      }));

      if (restaurant.price) {
        renderItems.push(ri('DETAILS_CARD_PRICE', {
          Price: priceList[restaurant.price - 1],
        }));
      }
      if (restaurant.phone) {
        renderItems.push(ri('DETAILS_CARD_PHONE', {
          Phone: restaurant.phone,
        }));
      }
      if (business) {
        if (business.open !== undefined) {
          renderItems.push(ri('DETAILS_CARD_OPERATING', {
            Status: ri(business.open ? 'DETAILS_CARD_OPEN' : 'DETAILS_CARD_CLOSED'),
          }));
        }
        if (business.transactions) {
          if (business.transactions.indexOf('delivery') > -1) {
            if (business.transactions.indexOf('restaurant_reservation') > -1) {
              renderItems.push(ri('DETAILS_CARD_DELIVER_RESERVATION'));
            } else {
              renderItems.push(ri('DETAILS_CARD_DELIVER'));
            }
          } else if (business.transactions.indexOf('restaurant_reservation') > -1) {
            renderItems.push(ri('DETAILS_CARD_RESERVATION'));
          }
        }
      }

      return handlerInput.jrm.renderBatch(renderItems);
    }).then((items) => {
      items.forEach((item) => {
        cardText += item;
      });

      return {speech: speech, cardText: cardText, imageUrl: imageUrl};
    });
  },
  showDetails: function(handlerInput, index) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let speech;
    let cardText;

    attributes.lastResponse.details = index;
    return module.exports.readRestaurantDetails(handlerInput)
    .then((result) => {
      speech = result.speech + ' <break time=\"200ms\"/> ';
      cardText = result.cardText;
      return handlerInput.jrm.render(ri('Jargon.defaultReprompt'));
    }).then((reprompt) => {
      speech += reprompt;
      attributes.state = 'DETAILS';
      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt(reprompt)
        .getResponse();
      // BUGBUG - Use cardText???
    });
  },
  buildYelpParameters: function(intent) {
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
  },
};

function paramsToText(handlerInput, noSSML) {
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  const params = attributes.lastSearch;
  let result = '';
  let retVal = '';
  const renderItems = [];

  if (params.open_now) {
    renderItems.push(ri('PARAMS_OPEN'));
  }
  if (params.rating) {
    const ratingMap = {'3,5': 'PARAMS_GOOD', '4,5': 'PARAMS_GREAT',
        '4.5,5': 'PARAMS_BEST',
        '0,2.5': 'PARAMS_BAD', '0,2': 'PARAMS_TERRIBLE'};

    renderItems.push(ri(ratingMap[params.rating]));
  }
  if (params.price) {
    const priceMap = {'1': 'PARAMS_CHEAP', '2': 'PARAMS_MODERATE',
        '3': 'PARAMS_SPENDY', '4': 'PARAMS_SPLURGE',
        '1,2': 'PARAMS_INEXPENSIVE', '3,4': 'PARAMS_EXPENSIVE'};

    renderItems.push(ri(priceMap[params.price]));
  }
  if (params.categories) {
    const catList = params.categories.split(',');

    catList.forEach((cat) => {
      result += (cat + ' ');
    });
  }
  renderItems.push(ri('PARAMS_RESTAURANTS'));

  return handlerInput.jrm.renderBatch(renderItems)
  .then((items) => {
    items.forEach((item) => {
      retVal = retVal + item + ' ';
    });

    if (params.location) {
      return readLocation(handlerInput, noSSML)
      .then((location) => {
        return handlerInput.jrm.render(ri('PARAMS_IN', {Location: location}));
      });
    } else {
      return '';
    }
  }).then((location) => {
    retVal += location;
    return retVal;
  });
}

function readLocation(handlerInput, noSSML) {
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  let retval = attributes.lastSearch.location;
  let isZIP = true;

  return handlerInput.jrm.render(ri('POSTAL_FORMAT'))
  .then((postalFormat) => {
    // If the location is a ZIP code, spell it out
    if (retval.length == postalFormat.length) {
      const zip = retval.toUpperCase(retval);
      let i;
      for (i = 0; i < postalFormat.length; i++) {
        const postalChar = postalFormat.substring(i, i + 1);
        const zipChar = zip.substring(i, i + 1);
        if (postalChar == 'N') {
          if (isNaN(parseInt(zipChar))) {
            isZIP = false;
          }
        } else if (postalChar == 'A') {
          if (!zipChar.match(/[a-z]/i)) {
            isZIP = false;
          }
        } else if (postalChar != zipChar) {
          isZIP = false;
        }
      }
    } else {
      isZIP = false;
    }

    if (isZIP) {
      // See if we can look this up
      return geocahe.getCityFromPostalCode(retval)
      .then((city) => {
        if (city) {
          retval = city;
        } else if (!noSSML) {
          retval = '<say-as interpret-as="digits">' + retval + '</say-as>';
        }
        return retval;
      });
    } else {
      return retval;
    }
  });
}

// Takes a potential category name and returns the name that
// should be pass to the Yelp API or undefined if no match found
function findCategoryInList(category) {
  let i;
  let alias;
  let close;

  for (i = 0; i < categoryList.length; i++) {
    if (category == categoryList[i].alias.toLowerCase()
        || (category == categoryList[i].title.toLowerCase())) {
      // This is it - use the alias
      alias = categoryList[i].alias;
      break;
    } else {
      // Let's see if it's close -- that is, the passed value
      // contains the category alias or name
      if ((category.indexOf(categoryList[i].alias.toLowerCase()) > -1)
        || (category.indexOf(categoryList[i].title.toLowerCase()) > -1)) {
        close = categoryList[i].alias;
      }
    }
  }

  return alias ? alias : close;
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
      'best': {field: 'rating', value: '4.5,5'},
      'exceptional': {field: 'rating', value: '4.5,5'},
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
/*
function buildListTemplate(context, callback) {
  let listTemplateBuilder;
  let listItemBuilder;
  let listTemplate;

  if (context.event.context &&
      context.event.context.System.device.supportedInterfaces.Display) {
    context.attributes.display = true;

    paramsToText(context, true, (location) => {
      listItemBuilder = new Alexa.templateBuilders.ListItemBuilder();
      listTemplateBuilder = new Alexa.templateBuilders.ListTemplate1Builder();
      let i = 0;

      context.attributes.lastResponse.restaurants.forEach((restaurant) => {
        listItemBuilder.addItem(null, 'item.' + i++,
          makeRichText('<font size="7">' + restaurant.name + '</font>'));
      });

      const listItems = listItemBuilder.build();
      listTemplate = listTemplateBuilder
        .setToken('listToken')
        .setTitle(location)
        .setListItems(listItems)
        .setBackButtonBehavior('HIDDEN')
        .build();

      context.response.renderTemplate(listTemplate);
      callback();
    });
  } else {
    callback();
  }
}
*/