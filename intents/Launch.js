//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const city = {'en-US': 'Seattle', 'en-CA': 'Toronto'};
    const format = 'Welcome to Restaurant Finder. You can find restaurants by type of cuisine or price range. For example, you can say Find a cheap Chinese restaurant in {0}. How can I help you?';
    const reprompt = 'For instructions on what you can say, please say help me.';
    const speech = format.replace('{0}', city[this.event.request.locale]);

    // Clear state
    this.handler.state = '';
    delete this.attributes['STATE'];
    utils.emitResponse(this, null, null, speech, reprompt);
  },
};
