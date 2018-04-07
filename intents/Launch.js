//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const speech = 'Welcome to Restaurant Finder. You can find restaurants by type of cuisine, price range, or with high Yelp reviews. For example, you can say Find a cheap Chinese restaurant in Seattle. How can I help you?';
    const reprompt = 'For instructions on what you can say, please say help me.';

    utils.emitResponse(this, null, null, speech, reprompt);
  },
};
