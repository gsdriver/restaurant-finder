//
// Repeats the last response
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    // I can only repeat if they did a Details or a Read List
    const lastAction = this.attributes.lastAction.split(',');

    if ((lastAction.length == 2) && (lastAction[0] == 'ReadList')) {
      // Reset read so we re-read the last response
      this.attributes.lastResponse.read = parseInt(lastAction[1]);
      yelp.ReadRestaurantsFromList(this.attributes.lastResponse, (speech, reprompt) => {
        utils.emitResponse(this, null, null, speech, reprompt);
      });
    } else if ((lastAction.length == 2) && (lastAction[0] == 'Details')) {
      yelp.ReadResturantDetails(this.attributes.lastResponse, parseInt(lastAction[1]), (error, speechResponse, speechReprompt, reprompt, saveState) => {
        utils.emitResponse(this, error, speechResponse, speechReprompt, reprompt);
      });
    }
    else
    {
      utils.emitResponse(this, null, 'You can say repeat after you\'ve read a list of restaurants or details on a specific restaurant.');
    }
  },
};
