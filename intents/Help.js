//
// Gives help to the user
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    let speech;
    const reprompt = 'What else can I help you with?';

    switch (this.handler.state) {
      case 'LIST':
        // Are there more restaurants?
        speech = 'Say repeat to hear this list again or say the number of the restaurant that you want more details about';
        if ((this.attributes.lastResponse.read + utils.PAGE_SIZE) <
          this.attributes.lastResponse.restaurants.length) {
          speech += ' or say more to hear more restaurants.';
        }
        break;
      case 'RESULTS':
        speech = 'Say read list to hear the list of restaurants.';
        break;
      case 'DETAILS':
        speech = 'You can say back to go back to the list of restaurants, or find restaurants to find more restaurants.';
        break;
      default:
        speech = 'You can find restaurants by type of cuisine, price range, or Yelp review. For example, you can say Find a cheap Chinese restaurant in Seattle';
        break;
    }

    utils.emitResponse(this, null, null, speech, reprompt);
  },
};
