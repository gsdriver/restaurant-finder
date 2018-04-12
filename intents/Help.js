//
// Gives help to the user
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    let speech;
    const reprompt = this.t('GENERIC_REPROMPT');

    switch (this.handler.state) {
      case 'LIST':
        // Are there more restaurants?
        speech = this.t('HELP_LIST');
        if ((this.attributes.lastResponse.read + utils.PAGE_SIZE) <
          this.attributes.lastResponse.restaurants.length) {
          speech += this.t('HELP_LIST_MORE');
        }
        break;
      case 'RESULTS':
        speech = this.t('HELP_RESULTS');
        break;
      case 'DETAILS':
        speech = this.t('HELP_DETAILS');
        break;
      default:
        speech = this.t('HELP_DEFAULT');
        break;
    }

    utils.emitResponse(this, null, null, speech, reprompt);
  },
};
