//
// Provides details on a specific restaurant
//

'use strict';

const utils = require('../utils');
const ri = require('@jargon/alexa-skill-sdk').ri;
const Back = require('./Back');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return ((request.type === 'IntentRequest') && (attributes.state === 'RESERVE')
      && ((request.intent.name === 'AMAZON.YesIntent') || (request.intent.name === 'AMAZON.NoIntent')));
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    if (request.intent.name === 'AMAZON.YesIntent') {
      // Kick off to start reservation
      return handlerInput.jrb
        .addDelegateDirective({
          name: 'ReserveIntent',
          confirmationStatus: 'NONE',
          slots: {}
        })
        .speak(ri('RESERVE_START'))
        .getResponse();
    } else {
      // OK, just go back
      return Back.handle(handlerInput);
    }
  },
};
