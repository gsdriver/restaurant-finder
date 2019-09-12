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

    // Note that if the user just says a number, it may come through
    // as the PartySize slot of ReserveIntent, so let's handle that too if they
    // are the in the process of reading a list...
    if ((request.type === 'IntentRequest') && (attributes.state === 'LIST')
      && ((request.intent.name === 'DetailsIntent') ||
          ((request.intent.name === 'ReserveIntent') && request.intent.slots
            && request.intent.slots.PartySize && request.intent.slots.PartySize.value) ||
         (attributes.isAuto &&
         ((request.intent.name === 'AMAZON.MoreIntent') || (request.intent.name === 'AMAZON.YesIntent'))))) {
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
  } else if (request.intent.name === 'AMAZON.YesIntent') {
    index = attributes.lastResponse.read;
  } else {
    // Look for an intent slot
    if (request.intent.slots && request.intent.slots.RestaurantID
      && request.intent.slots.RestaurantID.value) {
      index = parseInt(request.intent.slots.RestaurantID.value, 10);
    } else if (request.intent.slots && request.intent.slots.PartySize
      && request.intent.slots.PartySize.value) {
      index = parseInt(request.intent.slots.PartySize.value, 10);
    }

    if (index !== undefined) {
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
