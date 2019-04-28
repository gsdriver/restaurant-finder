//
// Reads a list of restaurants for the user
//

'use strict';

const utils = require('../utils');
const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if ((request.type === 'IntentRequest') &&
      (request.intent.name === 'ReadListIntent')) {
      return true;
    }

    if ((request.type === 'IntentRequest') && (attributes.state === 'LIST')
      && ((request.intent.name === 'AMAZON.NextIntent') ||
         (!attributes.isAuto && (request.intent.name === 'AMAZON.MoreIntent')))) {
      return true;
    }

    if ((request.type === 'IntentRequest') && (attributes.state === 'LIST')
      && attributes.isAuto && (request.intent.name === 'AMAZON.NoIntent')) {
      return true;
    }

    return false;
  },
  handle: function(handlerInput) {
    let toRead;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // If I don't have a list, tell them to search first
    if (!attributes.lastResponse
      || !attributes.lastResponse.restaurants
      || !attributes.lastResponse.restaurants.length) {
      return handlerInput.jrb
        .speak(ri('READLIST_SEARCH'))
        .reprompt(ri('READLIST_SEARCH_REPROMPT'))
        .getResponse();
    }

    // If the last action was to read Details, then we should
    // re-read the list rather than going to the next chunk
    if (attributes.state == 'DETAILS') {
      toRead = attributes.lastResponse.read || 0;
    } else {
      toRead = (attributes.lastResponse.read + utils.pageSize(handlerInput)) || 0;
    }

    // OK, read the next set
    if (toRead >= attributes.lastResponse.restaurants.length) {
      return handlerInput.jrb
        .speak(ri('READLIST_END'))
        .reprompt(ri('Jargon.defaultReprompt'))
        .getResponse();
    } else {
      // OK, let's read - store the starting location first since reading the list will change it
      attributes.state = 'LIST';
      attributes.lastResponse.read = toRead;
      return utils.readRestaurantsFromList(handlerInput)
      .then((result) => {
        // Awesome - now that we've read, we need to write this back out to the DB
        // in case there are more results to read
        return handlerInput.responseBuilder
          .speak(result.speech)
          .reprompt(result.reprompt)
          .getResponse();
      });
    }
  },
};
