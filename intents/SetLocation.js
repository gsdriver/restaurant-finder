//
// Allows the user to set their location
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    // If they have a location, we can use it - it can either be a city or a 5-digit ZIP code
    const locationSlot = this.event.request.intent.slots.Location;
    const locationZIPSlot = this.event.request.intent.slots.LocationZIP;
    let location;

    if (locationSlot && locationSlot.value) {
      location = locationSlot.value;
    } else if (locationZIPSlot && locationZIPSlot.value) {
      // Has to be five digits
      if (locationZIPSlot.value.length != 5) {
        utils.emitResponse(this, null, 'Please specify a city name or five-digit ZIP code as your preferred location');
        return;
      }
      location = locationZIPSlot.value;
    } else {
      utils.emitResponse(this, null, 'Please specify a city name or five-digit ZIP code as your preferred location.');
      return;
    }

    // They are specifying a location - we will set this in the DB - make sure to preserve
    // any other entries associated with this user
    this.attributes.location = location;
    let speech = 'Preferred location set to ' + utils.readLocation(location) + '.';

    // If this isn't a ZIP code, suggest that they can set by ZIP code
    if (location.length != 5 || isNaN(parseInt(location))) {
      speech += ' If this is incorrect, you can also specify a five-digit ZIP code.';
    }

    utils.emitResponse(this, null, speech);
  },
};
