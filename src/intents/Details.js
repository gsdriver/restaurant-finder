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

    // Details on a specific restaurant
    "DetailsIntent" : function (intent, session, response) {
        var idSlot = intent.slots.RestaurantID;

        if (!idSlot || !idSlot.value)
        {
            SendAlexaResponse("I'm sorry, I didn't hear a number of the restaurant you wanted details about.", null, null, null, response);
            return;
        }

        // They need to have a list to read details from
        storage.loadUserData(session, function(userData) {
            // OK, let's get the details
            yelp.ReadResturantDetails(userData.lastResponse, idSlot.value, function(error, speechResponse, speechReprompt, reprompt, readDetails) {
                // If the user successfully read the list, then the last action has changed, otherwise keep the last action as it was
                if (readDetails)
                {
                    userData.lastAction = "Details," + idSlot.value;
                    userData.save();
                }
                SendAlexaResponse(error, speechResponse, speechReprompt, reprompt, response);
            });
        });
    },