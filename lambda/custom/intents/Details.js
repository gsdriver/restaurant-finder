//
// Provides details on a specific restaurant
//

'use strict';

const utils = require('../utils');
const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if ((request.type === 'IntentRequest') && (attributes.state === 'LIST')
      && (request.intent.name === 'DetailsIntent')) {
      return true;
    }

    if ((request.type === 'Display.ElementSelected') && (attributes.state === 'LIST')) {
      return true;
    }

    return false;
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if (!attributes.lastResponse) {
      return handlerInput.jrb
        .speak(ri('DETAILS_NOLIST'))
        .reprompt(ri('Jargon.defaultReprompt'))
        .getResponse();
    }

    const index = getSelectedIndex(handlerInput);
    if (index === undefined) {
      return handlerInput.jrb
        .speak(ri('DETAILS_NONUMBER'))
        .reprompt(ri('Jargon.defaultReprompt'))
        .getResponse();
    }

    // You have to be in list mode before you can ask for details
    if (attributes.state != 'LIST') {
      return handlerInput.jrb
        .speak(ri('DETAILS_READLIST'))
        .reprompt(ri('DETAILS_READLIST'))
        .getResponse();
    } else {
      // OK, let's get the details
      if (!attributes.lastResponse ||
        (index >= attributes.lastResponse.restaurants.length)) {
        return handlerInput.jrb
          .speak(ri('DETAILS_INVALID_NUMBER'))
          .reprompt(ri('DETAILS_INVALID_NUMBER_REPROMPT'))
          .getResponse();
      } else {
        return utils.showDetails(handlerInput, index);
      }
    }
  },
};

function getSelectedIndex(handlerInput) {
  const request = handlerInput.requestEnvelope.request;
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  let index;

  if (request.token) {
    const games = request.token.split('.');
    if (games.length === 2) {
      index = games[1];
    }
  } else {
    // Look for an intent slot
    if (request.intent.slots && request.intent.slots.RestaurantID
      && request.intent.slots.RestaurantID.value) {
      index = parseInt(request.intent.slots.RestaurantID.value);

      if (isNaN(index)) {
        index = undefined;
      } else {
        // Need to base this off last read
        index = attributes.lastResponse.read + index - 1;
      }
    }
  }

  return index;
}
