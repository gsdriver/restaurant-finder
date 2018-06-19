//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const options = this.t('EXIT_GOODBYE').split('|');
    utils.emitResponse(this, null, options[Math.floor(Math.random() * options.length)]);
  },
};
