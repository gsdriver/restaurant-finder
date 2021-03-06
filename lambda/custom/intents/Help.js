//
// Gives help to the user
//

'use strict';

const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return ((request.type === 'IntentRequest') &&
      ((request.intent.name === 'AMAZON.HelpIntent') ||
      ((request.intent.name === 'AMAZON.FallbackIntent') && !attributes.state)));
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let speech;

    switch (attributes.state) {
      case 'LIST':
        // Are there more restaurants?
        if (attributes.lastResponse) {
          speech = 'HELP_LIST';
          if ((attributes.lastResponse.read + utils.pageSize(handlerInput)) <
            attributes.lastResponse.restaurants.length) {
            speech += '_MORE';
          }
        } else {
          speech = 'HELP_DEFAULT';
        }
        break;
      case 'RESULTS':
        speech = 'HELP_RESULTS';
        break;
      case 'DETAILS':
        speech = 'HELP_DETAILS';
        break;
      case 'RESERVE':
        speech = 'HELP_RESERVE';
        break;
      default:
        speech = 'HELP_DEFAULT';
        break;
    }

    return handlerInput.jrb
      .speak(ri(speech))
      .reprompt(ri('Jargon.defaultReprompt'))
      .getResponse();
  },
};
