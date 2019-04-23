//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');
const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest')
      && ((request.intent.name === 'BackIntent') || (request.intent.name === 'AMAZON.PreviousIntent')));
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // If the last action was read list, go to the previous chunk
    switch (attributes.state) {
      case 'LIST':
        attributes.lastResponse.read -= utils.pageSize(handlerInput);
        if (attributes.lastResponse.read < 0) {
          // If they were at the start of the list, just repeat it
          attributes.lastResponse.read = 0;
        }
        break;
      case 'DETAILS':
        // Just go back to the list state
        break;
      default:
        return handlerInput.jrb
          .speak(ri('BACK_NOBACK'))
          .reprompt(ri('Jargon.defaultReprompt'))
          .getResponse();
    }

    // OK, let's read - store the starting location first since reading the list will change it
    attributes.state = 'LIST';
    return utils.readRestaurantsFromList(handlerInput)
    .then((result) => {
      return handlerInput.responseBuilder
        .speak(result.speech)
        .reprompt(result.reprompt)
        .getResponse();
    });
  },
};
