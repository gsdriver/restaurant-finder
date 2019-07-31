//
// Unhandled intents
//

'use strict';

const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle: function(handlerInput) {
    return true;
  },
  handle: function(handlerInput) {
    return handlerInput.jrb
      .speak(ri('UNKNOWN_INTENT'))
      .reprompt(ri('UNKNOWN_INTENT_REPROMPT'))
      .getResponse();
  },
};
