//
// Provides details on a specific restaurant
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const idSlot = this.event.request.intent.slots.RestaurantID;

    if (!idSlot || !idSlot.value || isNaN(idSlot.value)) {
      utils.emitResponse(this, null, null,
          'I\'m sorry, I didn\'t hear a number of the restaurant you wanted details about.',
          'What else can I help you with?');
    }

    // You have to be in list mode before you can ask for details
    if (this.handler.state != 'LIST') {
      utils.emitResponse(this, null, null,
        'Please ask to start reading the list before asking for details.',
        'Please ask to start reading the list before asking for details.');
    } else {
      // OK, let's get the details
      const index = this.attributes.lastResponse.read + parseInt(idSlot.value) - 1;

      if (index >= this.attributes.lastResponse.restaurants.length) {
        utils.emitResponse(this, null, null,
          idSlot.value + ' is not a valid option to read. Please ask for a valid number or say repeat to repeat ths list.',
          'Please ask for a valid number of say repeat to repeat the list.');
      } else {
        this.attributes.lastResponse.details = index;
        let speech = utils.readRestaurantDetails(this.attributes.lastResponse);
        const reprompt = 'What else can I help you with?';
        speech += ' ' + reprompt;

        this.handler.state = 'DETAILS';
        utils.emitResponse(this, null, null, speech, reprompt);
      }
    }
  },
};
