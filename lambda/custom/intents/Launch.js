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
    const event = handlerInput.requestEnvelope;

    attributes.state = undefined;
    attributes.lastSearch = undefined;
    attributes.lastResponse = undefined;

    const welcomeFormat = (event.context && event.context.System &&
        event.context.System.device &&
        event.context.System.device.supportedInterfaces &&
        event.context.System.device.supportedInterfaces.Geolocation)
        ? 'LAUNCH_WELCOME_GEO' : 'LAUNCH_WELCOME';

    return handlerInput.jrb
      .speak(ri(welcomeFormat, {
        Qualifier: ri('LAUNCH_QUALIFIER'),
        Cuisine: ri('LAUNCH_CUISINE'),
        Cities: ri('LAUNCH_CITIES'),
      }))
      .reprompt(ri('LAUNCH_REPROMPT'))
      .getResponse();
  },
};
