/*
 * Source file that connects to Yelp
 */

var config = require("./config");
const https = require('https');
const querystring = require('querystring');

module.exports = {
    ReadRestaurantResults : function(params, callback) {
        // First get the list of restaurants
        GetRestaurantList(params, function(error, response) {
            // OK, let them know how many results were found, and give them an option to filter
            if (error)
            {
                callback(error, null, null, null);
            }
            else
            {
                var speech, reprompt;

console.log(JSON.stringify(response));

                // If there are more than five results, prompt the user to filter further
                if (response.total > 5)
                {
                    speech = "I found " + ((response.total > 100) ? "more than 100" : response.total) + " " + ParamsToText(params) + ". ";
                    reprompt = "Say an extra filter if you would like to narrow the list, or say Read List if you would like me to start reading the list.";
                    speech += reprompt;
                    callback(null, null, speech, reprompt);
                }
                else if (response.total > 0)
                {
                    // OK, read the names as allow them to ask for more detail on any choice
                    speech = "I found " + response.total + " restaurants. ";
                    reprompt = "You can ask for more details on any of these restaurants by saying that restaurant number.";

                    speech += reprompt;

                    var i;
                    var ordinals = ["First", "Second", "Third", "Fourth", "Fifth"];
                    for (i = 0; i < response.restaurants.length; i++)
                    {
                        speech += (" " + ordinals[i] + " result is " + response.restaurants[i].name + ".");
                    }

                    callback(null, null, speech, reprompt);
                }
                else
                {
                    speech = "I'm sorry, I didn't find any " + ParamsToText(params);

                    callback(null, speech, null, null);
                }
            }
        });
    }
};

function SendYelpRequest(path, callback)
{
    var headers = {"Authorization": "Bearer " + config.token};
    var options = { hostname: 'api.yelp.com', port: 443, path: path, method: "GET", headers: headers };

    var req = https.request(options, (res) => {
        if (res.statusCode == 200)
        {
            // Process the response
            var fulltext = '';
            res.on('data', (data) => {fulltext += data;});
            res.on('end', () => callback(null, JSON.parse(fulltext)));
        }
        else
        {
            // Sorry, there was an error calling the HTTP endpoint
            callback("Unable to call endpoint", null);
        }
    });

    req.end();
    req.on('error', (e) => { callback(e, null); });
}

/* Params has the following structure:
 *   location: string identifying the location (city or ZIP)
 *   categories: Categories which should be matched
 *   open_now: Boolean indicating if the location is open now
 *   radius: Either tight (1 mile) or wide (25 miles) If not set, default is 10 miles
 *
 *   See https://www.yelp.com/developers/documentation/v3/business_search
 *   for Yelp API documentation
 */
function GetRestaurantList(params, callback)
{
    var urlPath = "/v3/businesses/search?term=restaurants&";

    // BUGBUG - Should we do some validation on params?
    urlPath += querystring.stringify(params);
    SendYelpRequest(urlPath, function(error, response) {
        if (error) {
            callback(error, null);
        }
        else {
            // Do some processing first
            var results = {total: response.total, restaurants: []};

            response.businesses.forEach(restaurant => {
                let myResult = {};

                myResult.name = restaurant.name;
                myResult.phone = restaurant.phone;
                myResult.location = restaurant.location;
                myResult.rating = restaurant.rating;
                myResult.review_count = restaurant.review_count;
                myResult.is_closed = restaurant.is_closed;
                myResult.price = restaurant.price;
                myResult.distance = restaurant.distance;

                results.restaurants.push(myResult);
            });

            callback(error, results);
        }
    });
}

/*
 * Converts the parameters that were passed in into a text string
 */
function ParamsToText(params)
{
    var result = "";

    if (params.open_now)
    {
        result += "open ";
    }
    if (params.categories)
    {
        var catList = params.categories.split(",");

        catList.forEach(cat => {result += (cat + " ");});
    }
    result += "restaurants";

    if (params.location)
    {
        result += " in " + params.location;
    }

    return result;
}
