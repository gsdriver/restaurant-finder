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

    // Back
    "BackIntent" : function (intent, session, response) {
        storage.loadUserData(session, function(userData) {
            // If the last action was read list, go to the previous chunk of 5
            if (userData.lastAction.indexOf("ReadList") > -1)
            {
                userData.lastResponse.read -= ((userData.lastResponse.read % 5) ? (userData.lastResponse.read % 5) : 5);
                userData.lastResponse.read -= 5;
                if (userData.lastResponse.read < 0)
                {
                    // If they were at the start of the list, just repeat it
                    userData.lastResponse.read = 0;
                }
            }
            // If the last action was details, read the list again
            else if (userData.lastAction.indexOf("Details") > -1)
            {
                userData.lastResponse.read -= ((userData.lastResponse.read % 5) ? (userData.lastResponse.read % 5) : 5);
            }
            else
            {
                SendAlexaResponse(null, "I can't go back from this point. Please ask for a new set of restaurants.", null, null, response);
                return;
            }

            // OK, let's read - store the starting location first since reading the list will change it
            userData.lastAction = "ReadList," + userData.lastResponse.read;
            yelp.ReadRestaurantsFromList(userData.lastResponse, function(speech, reprompt) {
                // Awesome - now that we've read, we need to write this back out to the DB
                // in case there are more results to read
                userData.save((error) => {
                    SendAlexaResponse(null, null, speech, reprompt, response);
                });
            });
        });
    },
