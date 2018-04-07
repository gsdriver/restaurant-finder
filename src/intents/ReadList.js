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

    // Read list
    "ReadListIntent" : function (intent, session, response) {
        // We have to have a list to read
        storage.loadUserData(session, function(userData) {
            // If the last action was to read Details, then we should re-read the list rather than going to the next chunk
            if (userData.lastAction.indexOf("Details") > -1)
            {
                userData.lastResponse.read -= ((userData.lastResponse.read % 5) ? (userData.lastResponse.read % 5) : 5);
            }

            if (userData.lastResponse.read >= userData.lastResponse.restaurants.length) {
                var speech = "You are at the end of the list. Please ask for a new set of restaurants.";

                SendAlexaResponse(null, speech, null, null, response);
            }
            else
            {
                // OK, let's read - store the starting location first since reading the list will change it
                userData.lastAction = "ReadList," + userData.lastResponse.read;
                yelp.ReadRestaurantsFromList(userData.lastResponse, function(speech, reprompt) {
                    // Awesome - now that we've read, we need to write this back out to the DB
                    // in case there are more results to read
                    userData.save((error) => {
                        SendAlexaResponse(null, null, speech, reprompt, response);
                    });
                });
            }
        });
    },
