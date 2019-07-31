//
// Handles opening the skill
//

'use strict';

const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') &&
      ((request.intent.name === 'AMAZON.CancelIntent') || (request.intent.name === 'AMAZON.StopIntent')));
  },
  handle: function(handlerInput) {
    return handlerInput.jrb
      .speak(ri('EXIT_GOODBYE'))
      .withShouldEndSession(true)
      .getResponse();
  },
};
