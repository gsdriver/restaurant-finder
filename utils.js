//
// Utility functionals
//

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

    context.emit(':responseReady');
  },
  // Cache functions
  readLocation: function(location) {
    // If the location is a ZIP code, spell it out
    let retval = location;

    if ((location.length == 5) && !isNaN(parseInt(location))) {
      // This is a ZIP code
      retval = location.substring(0, 1) + ' ' + location.substring(1, 2) + ' ' + location.substring(2, 3) + ' ' +
                  location.substring(3, 4) + ' ' + location.substring(4, 5);
    }

    return retval;
  },
  readRestaurantResults: function(attributes, callback) {
    let speech;
    let reprompt;

    // If there are more than five results, prompt the user to filter further
    if (!attributes.lastResponse || !attributes.lastResponse.restaurants
      || !attributes.lastResponse.restaurants.length) {
      speech = 'I\'m sorry, I didn\'t find any ' + paramsToText(attributes.lastSearch) + '. ';
      reprompt = 'What else can I help you with?';
      speech += reprompt;
      state = '';
    } else if (attributes.lastResponse.total > LIST_LENGTH) {
      speech = 'I found ' + ((attributes.lastResponse.total > 50)
        ? 'more than 50' : attributes.lastResponse.total);
      speech += ' ' + paramsToText(attributes.lastSearch) + '. ';
      reprompt = 'Repeat your request with additional conditions like good or cheap to narrow the list, or say Read List to start reading the list.';
      speech += reprompt;
      state = 'RESULTS';
    } else {
      attributes.lastResponse.read = 0;
      speech = 'I found ' + attributes.lastResponse.total + ' ' + paramsToText(attributes.lastSearch) + '. ';

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

    // Read information about the restaurant
    speech = restaurant.name + ' is located at ' + restaurant.location.address1 + ' in ' + restaurant.location.city;
    speech += ('. It has a Yelp rating of ' + restaurant.rating + ' based on ' + restaurant.review_count + ' reviews.');
    if (restaurant.price) {
      speech += (' It is a ' + priceList[restaurant.price - 1] + ' option.');
    }
    if (restaurant.phone) {
      speech += (' The phone number is ' + restaurant.phone);
    }

    return speech;
  },
};

// Converts parameters to a string
function paramsToText(params) {
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
    result += ' in ' + module.exports.readLocation(params.location);
  }

  return result;
}
