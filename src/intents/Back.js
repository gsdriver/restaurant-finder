//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    // If the last action was read list, go to the previous chunk of 5
    if (this.attributes.lastAction.indexOf('ReadList') > -1) {
      this.attributes.lastResponse.read -= ((this.attributes.lastResponse.read % 5) ? (this.attributes.lastResponse.read % 5) : 5);
      this.attributes.lastResponse.read -= 5;
      if (this.attributes.lastResponse.read < 0) {
        // If they were at the start of the list, just repeat it
        this.attributes.lastResponse.read = 0;
      }
    } else if (this.attributes.lastAction.indexOf('Details') > -1) {
      this.attributes.lastResponse.read -= ((this.attributes.lastResponse.read % 5) ? (this.attributes.lastResponse.read % 5) : 5);
    } else {
      utils.emitResponse(this, null, 'I can\'t go back from this point. Please ask for a new set of restaurants.');
      return;
    }

    // OK, let's read - store the starting location first since reading the list will change it
    this.attributes.lastAction = 'ReadList,' + this.attributes.lastResponse.read;
    yelp.readRestaurantsFromList(this.attributes.lastResponse, (speech, reprompt) => {
      utils.emitResponse(this, null, null, speech, reprompt);
    });
  },
};
