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

    "FindRestaurantIntent": function (intent, session, response) {
        // Build up our parameter structure from the intent
        var params = BuildYelpParameters(intent);
        var error;

        // First read in the last result in case we need to reference that instead
        storage.loadUserData(session, function(userData) {
            // If they didn't set a location in the request and we don't have one here, we
            // will prompt the user for their current location
            if (!params.location)
            {
                if (!userData.location)
                {
                    var speech = "As a new user, please specify your location by saying Set Location.";

                    SendAlexaResponse(null, speech, null, null, response);
                    return;
                }

                params.location = userData.location;
            }

            yelp.ReadRestaurantResults(params, function(speechError, speechResponse, speechQuestion, repromptQuestion, restaurantList) {
                if (restaurantList)
                {
                    userData.lastAction = ((restaurantList.total > 0) && (restaurantList.total <= 5)) ? "ReadList,0" : "FindRestaurant";
                    userData.lastResponse = restaurantList;
                    userData.save();
                }

                SendAlexaResponse(speechError, speechResponse, speechQuestion, repromptQuestion, response);
            });
        });
    },


/*
 * This function takes a potential category name and returns the
 * category name that should be passed to the Yelp API, or null
 * if no matching category can be found
 * It's assumed the input is in lowercase
 */
function FindCategoryInList(category)
{
    var i;
    var alias = null;

    for (i = 0; i < categoryList.length; i++)
    {
        if (category == categoryList[i].alias.toLowerCase()
            || (category == categoryList[i].title.toLowerCase()))
        {
            // This is it - use the alias
            alias = categoryList[i].alias;
            break;
        }
    }

    return alias;
}

/*
 * This function takes a value and attempts to fit it into structure
 * to send to Yelp as appropriate
 */
function AddYelpParameter(params, value)
{
    var category = FindCategoryInList(value);
    var mapping = {
        "open": {field: "open_now", value: true},
        "open now": {field: "open_now", value: true},
        "cheap": {field: "price", value: "1"},
        "moderate": {field: "price", value: "2"},
        "spendy": {field: "price", value: "3"},
        "splurge": {field: "price", value: "4"},
        "inexpensive": {field: "price", value: "1,2"},
        "expensive": {field: "price", value: "3,4"},
        "costly": {field: "price", value: "4"},
        "pricey": {field: "price", value: "3,4"},
        "good": {field: "rating", value: "3,5"},
        "great": {field: "rating", value: "4,5"},
        "bad": {field: "rating", value: "0,2.5"},
        "terrible": {field: "rating", value: "0,2"}
    };

    if (category)
    {
        // OK, this matches a category
        if (params.categories)
        {
            params.categories += ("," + category);
        }
        else
        {
            params.categories = category;
        }
    }
    else if (mapping[value])
    {
        params[mapping[value].field] = mapping[value].value;
    }
}

/*
 * This function takes the Alexa intents and builds up a potential
 * structure to pass into the Yelp API
 */
function BuildYelpParameters(intent)
{
    var params = {};

    // You can have up to three intent slots - first let's see if we have a category
    if (intent.slots.FirstDescriptor && intent.slots.FirstDescriptor.value)
    {
        AddYelpParameter(params, intent.slots.FirstDescriptor.value.toLowerCase());
    }
    if (intent.slots.SecondDescriptor && intent.slots.SecondDescriptor.value)
    {
        AddYelpParameter(params, intent.slots.SecondDescriptor.value.toLowerCase());
    }
    if (intent.slots.ThirdDescriptor && intent.slots.ThirdDescriptor.value)
    {
        AddYelpParameter(params, intent.slots.ThirdDescriptor.value.toLowerCase());
    }
    if (intent.slots.Location && intent.slots.Location.value)
    {
        params.location = intent.slots.Location.value;
    }
    else if (intent.slots.LocationZIP && intent.slots.LocationZIP.value && intent.slots.LocationZIP.value.length == 5)
    {
        params.location = intent.slots.LocationZIP.value;
    }

    return params;
}