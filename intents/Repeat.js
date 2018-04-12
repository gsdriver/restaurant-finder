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
        utils.readRestaurantResults(this, (speech, reprompt) => {
          utils.emitResponse(this, null, null, speech, reprompt);
        });
        break;
      case 'LIST':
        utils.readRestaurantsFromList(this, (speech, reprompt) => {
          utils.emitResponse(this, null, null, speech, reprompt);
        });
        break;
      case 'DETAILS':
        utils.readRestaurantDetails(this, (text) => {
          const reprompt = this.t('GENERIC_REPROMPT');
          const speech = text + ' <break time=\"200ms\"/> ' + reprompt;
          utils.emitResponse(this, null, null, speech, reprompt);
        });
        break;
      default:
        utils.emitResponse(this, null, null, this.t('REPEAT_NONE'), this.t('GENERIC_REPROMPT'));
        break;
    }
  },
};
