//
// Provides details on a specific restaurant
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    if (!this.attributes.lastResponse) {
      utils.emitResponse(this, null, null, this.t('DETAILS_NOLIST'), this.t('GENERIC_REPROMPT'));
      return;
    }

    const index = getSelectedIndex(this);

    if (index === undefined) {
      utils.emitResponse(this, null, null, this.t('DETAILS_NONUMBER'), this.t('GENERIC_REPROMPT'));
      return;
    }

    // You have to be in list mode before you can ask for details
    if (this.handler.state != 'LIST') {
      utils.emitResponse(this, null, null, this.t('DETAILS_READLIST'), this.t('DETAILS_READLIST'));
    } else {
      // OK, let's get the details
      if (!this.attributes.lastResponse ||
        (index >= this.attributes.lastResponse.restaurants.length)) {
        utils.emitResponse(this, null, null,
          this.t('DETAILS_INVALID_NUMBER'), this.t('DETAILS_INVALID_NUMBER_REPROMPT'));
      } else {
        showDetails(this, index);
      }
    }
  },
  handleNextIntent: function() {
    // Go to the next restaurant in the list
    const index = this.attributes.lastResponse.details + 1;
    if (!this.attributes.lastResponse ||
      (index >= this.attributes.lastResponse.restaurants.length)) {
      utils.emitResponse(this, null, null, this.t('DETAILS_LISTEND'), this.t('DETAILS_LISTEND_REPROMPT'));
    } else {
      showDetails(this, index);
    }
  },
};

function showDetails(context, index) {
  context.attributes.lastResponse.details = index;
  utils.readRestaurantDetails(context, (text, cardText, imageUrl) => {
    const reprompt = context.t('GENERIC_REPROMPT');
    const speech = text + ' <break time=\"200ms\"/> ' + reprompt;

    context.handler.state = 'DETAILS';
    utils.emitResponse(context, null, null, speech, reprompt,
      context.attributes.lastResponse.restaurants[index].name, cardText, imageUrl);
  });
}

function getSelectedIndex(context) {
  let index;

  if (context.event.request.token) {
    const games = context.event.request.token.split('.');
    if (games.length === 2) {
      index = games[1];
    }
  } else {
    // Look for an intent slot
    if (context.event.request.intent.slots && context.event.request.intent.slots.RestaurantID
      && context.event.request.intent.slots.RestaurantID.value) {
      index = parseInt(context.event.request.intent.slots.RestaurantID.value);

      if (isNaN(index)) {
        index = undefined;
      } else {
        // Need to base this off last read
        index = context.attributes.lastResponse.read + index - 1;
      }
    }
  }

  return index;
}
