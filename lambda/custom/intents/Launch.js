//
// Handles opening the skill
//

'use strict';

const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle: function(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'LaunchRequest');
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    attributes.state = undefined;
    attributes.lastSearch = undefined;
    attributes.lastResponse = undefined;

    return handlerInput.jrb
      .speak(ri('LAUNCH_WELCOME', {
        Qualifier: ri('LAUNCH_QUALIFIER'),
        Cuisine: ri('LAUNCH_CUISINE'),
        Cities: ri('LAUNCH_CITIES'),
      }))
      .reprompt(ri('LAUNCH_REPROMPT'))
      .getResponse();
  },
};
