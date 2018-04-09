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
      context.response.speak('Sorry, something went wrong')
        .listen('What can I help you with?');
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
  readRestaurantResults: function(attributes, callback) {
    let speech;
    let reprompt;

    // If there are more than five results, prompt the user to filter further
    if (!attributes.lastResponse || !attributes.lastResponse.restaurants
      || !attributes.lastResponse.restaurants.length) {
      speech = 'I\'m sorry, I didn\'t find any ' + paramsToText(attributes) + '. ';
      reprompt = 'What else can I help you with?';
      speech += reprompt;
      state = '';
    } else if (attributes.lastResponse.total > LIST_LENGTH) {
      speech = 'I found ' + attributes.lastResponse.total + ' ' + paramsToText(attributes) + '. ';

      // More than two pages of results?  Suggest a filter
      reprompt = 'Say read list to start reading the list';
      if (attributes.lastResponse.total > 2 * LIST_LENGTH) {
        if (!attributes.lastSearch.price
          || !attributes.lastSearch.categories
          || !attributes.lastSearch.rating) {
          reprompt += ' <break time=\"200ms\"/> or filter your search with additional conditions like ';
          if (!attributes.lastSearch.categories) {
            reprompt += pickRandomOption('chinese|british|italian|mexican|steakhouse|german');
          } else if (!attributes.lastSearch.rating) {
            reprompt += pickRandomOption('good|great');
          } else if (!attributes.lastSearch.price) {
            reprompt += pickRandomOption('cheap|moderate|expensive');
          }
        }
      }

      reprompt += '.';
      speech += reprompt;
      state = 'RESULTS';
    } else {
      attributes.lastResponse.read = 0;
      speech = 'I found ' + attributes.lastResponse.total + ' ' + paramsToText(attributes) + '. ';

      let i;
      for (i = 0; i < attributes.lastResponse.restaurants.length; i++) {
        speech += (' ' + (i + 1) + ' <break time=\"200ms\"/> ');
        speech += attributes.lastResponse.restaurants[i].name + '.';
      }
      reprompt = 'You can ask for more details by saying the corresponding restaurant number';
      speech += ' ' + reprompt;
      state = 'LIST';
    }

    callback(speech, reprompt, state);
  },
  readRestaurantsFromList: function(restaurantList, callback) {
    let speech;
    let reprompt;
    const toRead = Math.min(restaurantList.restaurants.length - restaurantList.read, LIST_LENGTH);

    // OK, read the names as allow them to ask for more detail on any choice
    speech = 'Reading ' + toRead + ' restaurants. ';
    reprompt = 'You can ask for more details by saying the corresponding restaurant number';
    reprompt += ((restaurantList.restaurants.length - restaurantList.read > LIST_LENGTH) ? ' or say More to hear more results. ' : '. ');
    speech += reprompt;

    let i;
    for (i = 0; i < toRead; i++) {
      speech += (' ' + (i + 1) + ' <break time=\"200ms\"/> ' + restaurantList.restaurants[restaurantList.read + i].name + '.');
    }

    // Return the speech and reprompt text
    callback(speech, reprompt);
  },
  readRestaurantDetails: function(restaurantList, callback) {
    const restaurant = restaurantList.restaurants[restaurantList.details];
    const priceList = ['cheap', 'moderately priced', 'spendy', 'splurge'];
    let speech;
    let cardText = '';

    yelp.businessLookup(restaurant.id, (error, business) => {
      const imageUrl = (business) ? business.image_url : undefined;

      // Read information about the restaurant
      speech = restaurant.name + ' is located at ' + restaurant.location.address1 + ' in ' + restaurant.location.city;
      speech += ('<break time=\"200ms\"/> It has a Yelp rating of ' + restaurant.rating + ' based on ' + restaurant.review_count + ' reviews');
      if (restaurant.price) {
        speech += ('<break time=\"200ms\"/> It is a ' + priceList[restaurant.price - 1] + ' option.');
      }
      if (restaurant.phone) {
        speech += ('<break time=\"200ms\"/> The phone number is ' + restaurant.phone + '.');
      }
      if (business) {
        if (business.open !== undefined) {
          speech += ('<break time=\"200ms\"/> It is currently ' + (business.open ? 'open.' : 'closed.'));
        }
        if (business.transactions) {
          if (business.transactions.indexOf('delivery') > -1) {
            if (business.transactions.indexOf('restaurant_reservation') > -1) {
              speech += '<break time=\"200ms\"/> They deliver and take reservations.';
            } else {
              speech += '<break time=\"200ms\"/> They deliver.';
            }
          } else if (business.transactions.indexOf('restaurant_reservation') > -1) {
            speech += '<break time=\"200ms\"/> They take reservations.';
          }
        }
      }

      // And set up the card
      if (restaurant.location.display_address) {
        restaurant.location.display_address.forEach((address) => {
          cardText += (address + '\n');
        });
      } else {
        cardText += restaurant.location.address1 + '\n';
        cardText += restaurant.location.city + '\n';
      }
      cardText += ('Yelp rating: ' + restaurant.rating + ' (' + restaurant.review_count + ' reviews)\n');
      if (restaurant.price) {
        cardText += ('Price: ' + priceList[restaurant.price - 1] + '\n');
      }
      if (restaurant.phone) {
        cardText += ('Phone: ' + restaurant.phone + '\n');
      }
      if (business) {
        if (business.open !== undefined) {
          cardText += ('Currently: ' + (business.open ? 'Open' : 'Closed') + '\n');
        }
        if (business.transactions) {
          if (business.transactions.indexOf('delivery') > -1) {
            if (business.transactions.indexOf('restaurant_reservation') > -1) {
              cardText += 'Offers delivery and reservations\n';
            } else {
              cardText += 'Offers delivery\n';
            }
          } else if (business.transactions.indexOf('restaurant_reservation') > -1) {
            cardText += 'Offers reservations\n';
          }
        }
      }

      callback(speech, cardText, imageUrl);
    });
  },
};

function paramsToText(attributes) {
  const params = attributes.lastSearch;
  let result = '';

  if (params.open_now) {
    result += 'open ';
  }
  if (params.rating) {
    const ratingMap = {'3,5': 'good', '4,5': 'great', '0,2.5': 'bad', '0,2': 'terrible'};

    result += ratingMap[params.rating];
    result += ' ';
  }
  if (params.price) {
    const priceMap = {'1': 'cheap', '2': 'moderate', '3': 'spendy', '4': 'splurge',
        '1,2': 'inexpensive', '3,4': 'expensive'};

    result += priceMap[params.price];
    result += ' ';
  }
  if (params.categories) {
    const catList = params.categories.split(',');

    catList.forEach((cat) => {
      result += (cat + ' ');
    });
  }
  result += 'restaurants';

  if (params.location) {
    result += ' in ' + readLocation(attributes);
  }

  return result;
}

function readLocation(attributes) {
  // If the location is a ZIP code, spell it out
  let retval = attributes.lastSearch.location;
  let isZIP = true;

  if (attributes.postalFormat && (retval.length == attributes.postalFormat.length)) {
    const zip = retval.toUpperCase(retval);
    let i;
    for (i = 0; i < attributes.postalFormat.length; i++) {
      const postalChar = attributes.postalFormat.substring(i, i + 1);
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
    // This is a ZIP code - add a space between each character
    let location = '';
    let i;
    for (i = 0; i < retval.length; i++) {
      location += retval.substring(i, i + 1) + ' ';
    }
    retval = location;
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
      .setTitle(paramsToText(context.attributes))
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
