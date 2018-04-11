//
// Utility functionals
//

const Alexa = require('alexa-sdk');
// utility methods for creating Image and TextField objects
const makeRichText = Alexa.utils.TextUtils.makeRichText;
const yelp = require('./api/Yelp');
const LIST_LENGTH = 5;

module.exports = {
  PAGE_SIZE: LIST_LENGTH,
  emitResponse: function(context, error, response, speech, reprompt,
                        cardTitle, cardText, imageUrl) {
    if (error) {
      console.log('Speech error: ' + error);
      context.response.speak(context.t('SPEECH_ERROR'))
        .listen(context.t('GENERIC_REPROMPT'));
    } else if (response) {
      context.attributes.sessionCount = (context.attributes.sessionCount + 1) || 1;
      context.response.speak(response);
    } else if (cardTitle) {
      context.response.speak(speech)
        .listen(reprompt);
      if (imageUrl) {
        context.response.cardRenderer(cardTitle, cardText, {smallImageUrl: imageUrl});
      } else {
        context.response.cardRenderer(cardTitle, cardText);
      }
    } else {
      context.response.speak(speech)
        .listen(reprompt);
    }

    // If the state is now list, we draw the template
    if (context.handler.state == 'LIST') {
      buildListTemplate(context);
    }

    context.emit(':responseReady');
  },
  clearState: function(context) {
    context.handler.state = '';
    delete context.attributes['STATE'];
    context.attributes.lastSearch = undefined;
    context.attributes.lastResponse = undefined;
  },
  readRestaurantResults: function(context, callback) {
    const attributes = context.attributes;
    let speech;
    let reprompt;

    // If there are more than five results, prompt the user to filter further
    if (!attributes.lastResponse || !attributes.lastResponse.restaurants
      || !attributes.lastResponse.restaurants.length) {
      speech = context.t('RESULTS_NORESULTS').replace('{0}', paramsToText(context));
      reprompt = context.t('GENERIC_REPROMPT');
      speech += reprompt;
      state = '';
    } else if (attributes.lastResponse.total > LIST_LENGTH) {
      speech = context.t('RESULTS_RESULTS')
        .replace('{0}', attributes.lastResponse.total)
        .replace('{1}', paramsToText(context));

      // More than two pages of results?  Suggest a filter
      reprompt = context.t('RESULTS_REPROMPT');
      if (attributes.lastResponse.total > 2 * LIST_LENGTH) {
        if (!attributes.lastSearch.price
          || !attributes.lastSearch.categories
          || !attributes.lastSearch.rating) {
          let option;
          if (!attributes.lastSearch.categories) {
            option = pickRandomOption(context.t('RESULTS_FILTER_CUISINE'));
          } else if (!attributes.lastSearch.rating) {
            option = pickRandomOption(context.t('RESULTS_FILTER_RATING'));
          } else {
            option = pickRandomOption(context.t('RESULTS_FILTER_PRICE'));
          }
          reprompt += context.t('RESULTS_FILTER').replace('{0}', option);
        }
      }

      reprompt += '.';
      speech += reprompt;
      state = 'RESULTS';
    } else {
      attributes.lastResponse.read = 0;
      speech = context.t('RESULTS_RESULTS')
        .replace('{0}', attributes.lastResponse.total)
        .replace('{1}', paramsToText(context));

      let i;
      for (i = 0; i < attributes.lastResponse.restaurants.length; i++) {
        speech += (' ' + (i + 1) + ' <break time=\"200ms\"/> ');
        speech += attributes.lastResponse.restaurants[i].name + '.';
      }
      reprompt = context.t('RESULTS_DETAILS');
      speech += ' ' + reprompt;
      state = 'LIST';
    }

    callback(speech, reprompt, state);
  },
  readRestaurantsFromList: function(context, callback) {
    let speech;
    let reprompt;
    const restaurantList = context.attributes.lastResponse;
    const toRead = Math.min(restaurantList.restaurants.length - restaurantList.read, LIST_LENGTH);

    // OK, read the names as allow them to ask for more detail on any choice
    speech = context.t('READLIST_RESULTS').replace('{0}', toRead);
    reprompt = context.t('RESULTS_DETAILS');
    if (restaurantList.restaurants.length - restaurantList.read > LIST_LENGTH) {
      reprompt += context.t('READLIST_MORE');
    }
    reprompt += '. ';
    speech += reprompt;

    let i;
    for (i = 0; i < toRead; i++) {
      speech += (' ' + (i + 1) + ' <break time=\"200ms\"/> ' + restaurantList.restaurants[restaurantList.read + i].name + '.');
    }

    // Return the speech and reprompt text
    callback(speech, reprompt);
  },
  readRestaurantDetails: function(context, callback) {
    const restaurantList = context.attributes.lastResponse;
    const restaurant = restaurantList.restaurants[restaurantList.details];
    const priceList = ['DETAILS_PRICE_CHEAP', 'DETAILS_PRICE_MODERATE',
          'DETAILS_PRICE_SPENDY', 'DETAILS_PRICE_SPLURGE'];
    let speech;
    let cardText = '';

    yelp.businessLookup(restaurant.id, (error, business) => {
      const imageUrl = (business) ? business.image_url : undefined;

      // Read information about the restaurant
      speech = context.t('DETAILS_LOCATION')
        .replace('{0}', restaurant.name)
        .replace('{1}', restaurant.location.address1)
        .replace('{2}', restaurant.location.city);

      // And set up the card
      if (restaurant.location.display_address) {
        restaurant.location.display_address.forEach((address) => {
          cardText += (address + '\n');
        });
      } else {
        cardText += restaurant.location.address1 + '\n';
        cardText += restaurant.location.city + '\n';
      }
      cardText += context.t('DETAILS_CARD_YELP')
        .replace('{0}', restaurant.rating)
        .replace('{1}', restaurant.review_count);

      if (restaurant.price) {
        cardText += context.t('DETAILS_CARD_PRICE').replace('{0}', context.t(priceList[restaurant.price - 1]));
      }
      if (restaurant.phone) {
        speech += context.t('DETAILS_PHONE').replace('{0}', restaurant.phone);
        cardText += context.t('DETAILS_CARD_PHONE').replace('{0}', restaurant.phone);
      }
      if (business) {
        if (business.open !== undefined) {
          speech += context.t('DETAILS_OPERATING')
            .replace('{0}', context.t(business.open ? 'DETAILS_OPEN': 'DETAILS_CLOSED'));
          cardText += context.t('DETAILS_CARD_OPERATING')
            .replace('{0}', context.t(business.open ? 'DETAILS_CARD_OPEN': 'DETAILS_CARD_CLOSED'));
        }
        if (business.transactions) {
          if (business.transactions.indexOf('delivery') > -1) {
            if (business.transactions.indexOf('restaurant_reservation') > -1) {
              cardText += context.t('DETAILS_CARD_DELIVER_RESERVATION');
            } else {
              cardText += context.t('DETAILS_CARD_DELIVER');
            }
          } else if (business.transactions.indexOf('restaurant_reservation') > -1) {
            cardText += context.t('DETAILS_CARD_RESERVATION');
          }
        }
      }

      speech += context.t('DETAILS_SEECARD');
      callback(speech, cardText, imageUrl);
    });
  },
};

function paramsToText(context, noSSML) {
  const params = context.attributes.lastSearch;
  let result = '';

  if (params.open_now) {
    result += context.t('PARAMS_OPEN');
  }
  if (params.rating) {
    const ratingMap = {'3,5': 'PARAMS_GOOD', '4,5': 'PARAMS_GREAT',
        '0,2.5': 'PARAMS_BAD', '0,2': 'PARAMS_TERRIBLE'};

    result += context.t(ratingMap[params.rating]);
    result += ' ';
  }
  if (params.price) {
    const priceMap = {'1': 'PARAMS_CHEAP', '2': 'PARAMS_MODERATE',
        '3': 'PARAMS_SPENDY', '4': 'PARAMS_SPLURGE',
        '1,2': 'PARAMS_INEXPENSIVE', '3,4': 'PARAMS_EXPENSIVE'};

    result += context.t(priceMap[params.price]);
    result += ' ';
  }
  if (params.categories) {
    const catList = params.categories.split(',');

    catList.forEach((cat) => {
      result += (cat + ' ');
    });
  }
  result += context.t('PARAMS_RESTAURANTS');

  if (params.location) {
    const location = (noSSML) ? params.location : readLocation(context);
    result += context.t('PARAMS_IN').replace('{0}', location);
  }

  return result;
}

function readLocation(context) {
  // If the location is a ZIP code, spell it out
  const postalFormat = context.t('POSTAL_FORMAT');
  let retval = context.attributes.lastSearch.location;
  let isZIP = true;

  if (postalFormat && (retval.length == postalFormat.length)) {
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
    retval = '<say-as interpret-as="digits">' + retval + '</say-as>';
  }

  return retval;
}

function buildListTemplate(context) {
  let listTemplateBuilder;
  let listItemBuilder;
  let listTemplate;

  if (context.event.context &&
      context.event.context.System.device.supportedInterfaces.Display) {
    context.attributes.display = true;

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
      .setTitle(paramsToText(context, true))
      .setListItems(listItems)
      .setBackButtonBehavior('HIDDEN')
      .build();

    context.response.renderTemplate(listTemplate);
  }
}

function pickRandomOption(str) {
  const options = str.split('|');
  return options[Math.floor(Math.random() * options.length)];
}
