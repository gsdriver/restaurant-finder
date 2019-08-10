//
// Manages coming back to the session after a hand-off to make a reservation
//

'use strict';

const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionResumedRequest';
  },
  handle(handlerInput) {
    const statusCode = handlerInput.requestEnvelope.request.cause.status.code;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    attributes.state = undefined;
    if (statusCode == '200') {
      return handlerInput.jrb
        .speak(ri('RESERVE_SUCCESS'))
        .reprompt(ri('Jargon.defaultReprompt'))
        .getResponse();
    } else if (statusCode == '204') {
      return handlerInput.jrb
        .speak(ri('RESERVE_DECLINED'))
        .reprompt(ri('Jargon.defaultReprompt'))
        .getResponse();
    } else {
      return handlerInput.jrb
        .speak(ri('Jargon.defaultReprompt'))
        .reprompt(ri('Jargon.defaultReprompt'))
        .getResponse();
    }
  },
};
