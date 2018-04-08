//
// Reads a list of restaurants for the user
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    let toRead;

    // If the last action was to read Details, then we should
    // re-read the list rather than going to the next chunk
    if (this.handler.state == 'DETAILS') {
      toRead = this.attributes.lastResponse.read || 0;
    } else {
      toRead = (this.attributes.lastResponse.read + utils.PAGE_SIZE) || 0;
    }

    // OK, read the next set
    if (toRead >= this.attributes.lastResponse.restaurants.length) {
      utils.emitResponse(this, null, 'You are at the end of the list. Please ask for a new set of restaurants.');
    } else {
      // OK, let's read - store the starting location first since reading the list will change it
      this.handler.state = 'LIST';
      this.attributes.lastResponse.read = toRead;
      utils.readRestaurantsFromList(this.attributes.lastResponse, (speech, reprompt) => {
        // Awesome - now that we've read, we need to write this back out to the DB
        // in case there are more results to read
        utils.emitResponse(this, null, null, speech, reprompt);
      });
    }
  },
};
