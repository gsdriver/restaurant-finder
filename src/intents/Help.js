//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const speech = 'You can find restaurants by type of cuisine, price range, or Yelp review. For example, you can say Find a cheap Chinese restaurant in Seattle ... Now, what can I help you with?';
    const reprompt = 'You can find restaurants by type of cuisine, price range, or Yelp review, or you can say exit... Now, what can I help you with?';

    utils.emitResponse(this, null, null, speech, reprompt);
  },
};
