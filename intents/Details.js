//
// Provides details on a specific restaurant
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const index = getSelectedIndex(this);

    if (index === undefined) {
      utils.emitResponse(this, null, null,
          'I\'m sorry, I didn\'t hear a number of the restaurant you wanted details about.',
          'What else can I help you with?');
    }

    // You have to be in list mode before you can ask for details
    if (this.handler.state != 'LIST') {
      utils.emitResponse(this, null, null,
        'Please ask to start reading the list before asking for details.',
        'Please ask to start reading the list before asking for details.');
    } else {
      // OK, let's get the details
      if (index >= this.attributes.lastResponse.restaurants.length) {
        utils.emitResponse(this, null, null,
          'That is not a valid option to read. Please ask for a valid number or say repeat to repeat ths list.',
          'Please ask for a valid number of say repeat to repeat the list.');
      } else {
        showDetails(this, index);
      }
    }
  },
  handleNextIntent: function() {
    // Go to the next restaurant in the list
    const index = this.attributes.lastResponse.details + 1;
    if (index >= this.attributes.lastResponse.restaurants.length) {
      utils.emitResponse(this, null, null,
        'You are at the end of the list. Please do a new search or say back to go back to the list of results.',
        'Please search for another set of restaurants.');
    } else {
      showDetails(this, index);
    }
  },
};

function showDetails(context, index) {
  context.attributes.lastResponse.details = index;
  utils.readRestaurantDetails(context.attributes.lastResponse, (text, cardText, imageUrl) => {
    const reprompt = 'What else can I help you with?';
    const speech = text + ' <break time=\"200ms\"/> ' + reprompt;

    context.handler.state = 'DETAILS';
    utils.emitResponse(context, null, null, speech, reprompt,
      context.attributes.lastResponse.restaurants[index].name, cardText, imageUrl);
  });
}

function getSelectedIndex(context) {
  let index;

  if (context.event.request.token) {
    const games = context.event.request.token.split('.');
    if (games.length === 2) {
      index = games[1];
    }
  } else {
    // Look for an intent slot
    if (context.event.request.intent.slots && context.event.request.intent.slots.RestaurantID
      && context.event.request.intent.slots.RestaurantID.value) {
      index = parseInt(context.event.request.intent.slots.RestaurantID.value);

      if (isNaN(index)) {
        index = undefined;
      } else {
        // Need to base this off last read
        index = context.attributes.lastResponse.read + index - 1;
      }
    }
  }

  return index;
}
