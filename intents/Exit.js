//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    utils.emitResponse(this, null, 'Goodbye');
  },
};
