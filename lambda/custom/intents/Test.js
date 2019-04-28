//
// Handles running a test
//

'use strict';

const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    // We support tests 50 and 99
    if ((request.type === 'IntentRequest') && (request.intent.name === 'TestIntent')) {
      return (request.intent.slots && request.intent.slots.Test &&
        ([50, 99].indexOf(parseInt(request.intent.slots.Test.value)) > -1));
    }
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;
    let speech;

    // 50 means go into non-auto mode
    // 99 means go into auto mode
    if (request.intent.slots.Test.value == 99) {
      attributes.isAuto = true;
      speech = 'TEST_AUTO';
    } else if (request.intent.slots.Test.value == 50) {
      attributes.isAuto = undefined;
      speech = 'TEST_NOAUTO';
    }

    return handlerInput.jrb
      .speak(ri(speech))
      .reprompt(ri('Jargon.defaultReprompt'))
      .getResponse();
  },
};
