//
// Repeats the last response
//

'use strict';

const utils = require('../utils');
const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if ((request.type === 'IntentRequest') &&
      ((request.intent.name === 'AMAZON.RepeatIntent') || (request.intent.name === 'AMAZON.FallbackIntent'))) {
      return true;
    }

    if ((request.type === 'IntentRequest') && (attributes.state === 'DETAILS')
      && (request.intent.name === 'AMAZON.MoreIntent')) {
      return true;
    }

    return false;
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // Look at the state
    switch (attributes.state) {
      case 'RESULTS':
        return utils.readRestaurantResults(handlerInput)
        .then((result) => {
          return handlerInput.responseBuilder
            .speak(result.speech)
            .reprompt(result.reprompt)
            .getResponse();
        });
        break;
      case 'LIST':
        return utils.readRestaurantsFromList(handlerInput)
        .then((result) => {
          return handlerInput.responseBuilder
            .speak(result.speech)
            .reprompt(result.reprompt)
            .getResponse();
        });
        break;
      case 'DETAILS':
        let result;
        return utils.readRestaurantDetails(handlerInput)
        .then((details) => {
          result = details;
          return handlerInput.jrm.render(ri('Jargon.defaultReprompt'));
        }).then((reprompt) => {
          const speech = result.speech + ' <break time=\"200ms\"/> ' + reprompt;
          return handlerInput.responseBuilder
            .speak(speech)
            .reprompt(reprompt)
            .getResponse();
        });
        break;
      default:
        return handlerInput.jrb
          .speak(ri('REPEAT_NONE'))
          .reprompt(ri('Jargon.defaultReprompt'))
          .getResponse();
        break;
    }
  },
};
