//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const options = str.split(this.t('EXIT_GOODBYE'));
    utils.emitResponse(this, null, options[Math.floor(Math.random() * options.length)]);
  },
};
