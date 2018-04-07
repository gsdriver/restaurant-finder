//
// Reads a list of restaurants for the user
//

'use strict';

const utils = require('../utils');
const yelp = require('./Yelp');

module.exports = {
  handleIntent: function() {
    // If the last action was to read Details, then we should
    // re-read the list rather than going to the next chunk
    if (this.attributes.lastAction.indexOf('Details') > -1) {
      this.attributes.lastResponse.read -= ((this.attributes.lastResponse.read % 5)
        ? (this.attributes.lastResponse.read % 5) : 5);
    }

    if (this.attributes.lastResponse.read >= this.attributes.lastResponse.restaurants.length) {
      utils.emitResponse(this, null, 'You are at the end of the list. Please ask for a new set of restaurants.');
    } else {
      // OK, let's read - store the starting location first since reading the list will change it
      this.attributes.lastAction = 'ReadList,' + this.attributes.lastResponse.read;
      yelp.readRestaurantsFromList(this.attributes.lastResponse, (speech, reprompt) => {
        // Awesome - now that we've read, we need to write this back out to the DB
        // in case there are more results to read
        this.attributes.save((error) => {
          utils.emitResponse(this, null, null, speech, reprompt);
        });
      });
    }
  },
};
