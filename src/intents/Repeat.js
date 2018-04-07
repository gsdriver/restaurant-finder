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

    // Repeat intent - read the last thing we read
    "AMAZON.RepeatIntent": function (intent, session, response) {
        // Well, let's see what they did last so we can re-issue that command
        storage.loadUserData(session, function(userData) {
            // I can only repeat if they did a Details or a Read List
            var lastAction = userData.lastAction.split(",");

            if ((lastAction.length == 2) && (lastAction[0] == "ReadList"))
            {
                // Reset read so we re-read the last response
                userData.lastResponse.read = parseInt(lastAction[1]);
                yelp.ReadRestaurantsFromList(userData.lastResponse, function(speech, reprompt) {
                    SendAlexaResponse(null, null, speech, reprompt, response);
                });
            }
            else if ((lastAction.length == 2) && (lastAction[0] == "Details"))
            {
                yelp.ReadResturantDetails(userData.lastResponse, parseInt(lastAction[1]), function(error, speechResponse, speechReprompt, reprompt, saveState) {
                    SendAlexaResponse(error, speechResponse, speechReprompt, reprompt, response);
                });
            }
            else
            {
                SendAlexaResponse(null, "You can say repeat after you've read a list of restaurants or details on a specific restaurant.", null, null, response);
            }
        });
    },