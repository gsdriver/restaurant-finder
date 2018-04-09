//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    this.handler.state = '';
    delete this.attributes['STATE'];
    utils.emitResponse(this, null, null, this.t('LAUNCH_WELCOME'), this.t('LAUNCH_REPROMPT'));
  },
};
