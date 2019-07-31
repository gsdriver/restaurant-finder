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

    return ((request.type === 'IntentRequest') && (attributes.state === 'DETAILS')
      && (request.intent.name === 'AMAZON.NextIntent'));
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // Go to the next restaurant in the list
    const index = attributes.lastResponse.details + 1;
    if (!attributes.lastResponse ||
      (index >= attributes.lastResponse.restaurants.length)) {
      return handlerInput.jrb
        .speak(ri('DETAILS_LISTEND'))
        .reprompt(ri('DETAILS_LISTEND_REPROMPT'))
        .getResponse();
    } else {
      return utils.showDetails(handlerInput, index);
    }
  },
};
