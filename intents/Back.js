//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    // If the last action was read list, go to the previous chunk
    switch (this.handler.state) {
      case 'LIST':
        this.attributes.lastResponse.read -= utils.PAGE_SIZE;
        if (this.attributes.lastResponse.read < 0) {
          // If they were at the start of the list, just repeat it
          this.attributes.lastResponse.read = 0;
        }
        break;
      case 'DETAILS':
        // Just go back to the list state
        break;
      default:
        utils.emitResponse(this, null, 'I can\'t go back from this point. Please ask for a new set of restaurants.');
        return;
    }

    // OK, let's read - store the starting location first since reading the list will change it
    this.handler.state = 'LIST';
    utils.readRestaurantsFromList(this.attributes.lastResponse, (speech, reprompt) => {
      utils.emitResponse(this, null, null, speech, reprompt);
    });
  },
};
