//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const speech = this.t('LAUNCH_WELCOME')
      .replace('{0}', utils.pickRandomOption(this.t('LAUNCH_QUALIFIER')))
      .replace('{1}', utils.pickRandomOption(this.t('LAUNCH_CUISINE')))
      .replace('{2}', utils.pickRandomOption(this.t('LAUNCH_CITIES')));
    utils.clearState(this);
    utils.emitResponse(this, null, null, speech, this.t('LAUNCH_REPROMPT'));
  },
};
