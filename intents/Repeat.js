//
// Repeats the last response
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    // Look at the state
    switch (this.handler.state) {
      case 'RESULTS':
        utils.readRestaurantResults(this.attributes, (speech, reprompt) => {
          utils.emitResponse(this, null, null, speech, reprompt);
        });
        break;
      case 'LIST':
        utils.readRestaurantsFromList(this.attributes.lastResponse, (speech, reprompt) => {
          utils.emitResponse(this, null, null, speech, reprompt);
        });
        break;
      case 'DETAILS':
        utils.readRestaurantDetails(this.attributes.lastResponse, (text) => {
          const reprompt = 'What else can I help you with?';
          const speech = text + ' <break time=\"200ms\"/> ' + reprompt;
          utils.emitResponse(this, null, null, speech, reprompt);
        });
        break;
      default:
        utils.emitResponse(this, null, null,
            'I have nothing to repeat. What else can I help you with?',
            'What else can I help you with?');
        break;
    }
  },
};
