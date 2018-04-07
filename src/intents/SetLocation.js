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

    // Location intent
    "SetLocationIntent" : function (intent, session, response) {
        // If they have a location, we can use it - it can either be a city or a 5-digit ZIP code
        var locationSlot = intent.slots.Location;
        var locationZIPSlot = intent.slots.LocationZIP;
        var location;

        if (locationSlot && locationSlot.value)
        {
            location = locationSlot.value;
        }
        else if (locationZIPSlot && locationZIPSlot.value)
        {
            // Has to be five digits
            if (locationZIPSlot.value.length != 5)
            {
                SendAlexaResponse("Please specify a city name or five-digit ZIP code as your preferred location", null, null, null, response);
                return;
            }
            location = locationZIPSlot.value;
        }
        else
        {
            SendAlexaResponse("Please specify a city name or five-digit ZIP code as your preferred location.", null, null, null, response);
            return;
        }

        // They are specifying a location - we will set this in the DB - make sure to preserve
        // any other entries associated with this user
        storage.loadUserData(session, function(userData) {
            userData.location = location;
            userData.lastAction = "SetLocation";
            userData.save((error) => {
                var speech = "Preferred location set to " + utils.ReadLocation(location) + ".";

                // If this isn't a ZIP code, suggest that they can set by ZIP code
                if (location.length != 5 || isNaN(parseInt(location)))
                {
                    speech += " If this is incorrect, you can also specify a five-digit ZIP code.";
                }

                SendAlexaResponse(null, speech, null, null, response);
            });
        })
    },
