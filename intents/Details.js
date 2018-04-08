//
// Provides details on a specific restaurant
//

'use strict';

const utils = require('../utils');
const yelp = require('../Yelp');

module.exports = {
  handleIntent: function() {
    const idSlot = this.event.request.intent.slots.RestaurantID;

    if (!idSlot || !idSlot.value) {
      utils.emitResponse(this, null, 'I\'m sorry, I didn\'t hear a number of the restaurant you wanted details about.');
      return;
    }

    // OK, let's get the details
    yelp.readResturantDetails(this.attributes.lastResponse, idSlot.value,
      (error, speechResponse, speechReprompt, reprompt, readDetails) => {
      // If the user successfully read the list, then the last action has changed
      // otherwise keep the last action as it was
      if (readDetails) {
        this.attributes.lastAction = 'Details,' + idSlot.value;
      }

      utils.emitResponse(this, error, speechResponse, speechReprompt, reprompt);
    });
  },
};
