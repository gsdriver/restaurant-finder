/*
 * Source file that connects to Yelp
 */

'use strict';

var config = require("./config");
const https = require('https');
const querystring = require('querystring');

module.exports = {
    ReadRestaurantResults : function(params, callback) {
        // First get the list of restaurants
        GetRestaurantList(params, function(error, restaurantList) {
            // OK, let them know how many results were found, and give them an option to filter
            if (error)
            {
                callback(error, null, null, null, null);
            }
            else
            {
                var speech, reprompt;

                // If there are more than five results, prompt the user to filter further
                if (restaurantList.total > 5)
                {
                    speech = "I found " + ((restaurantList.total > 100) ? "more than 100" : restaurantList.total) + " " + ParamsToText(params) + ". ";
                    reprompt = "Repeat your request with additional conditions like good or cheap to narrow the list, or say Read List if you would like me to start reading the list.";
                    speech += reprompt;
                    callback(null, null, speech, reprompt, restaurantList);
                }
                else if (restaurantList.total > 0)
                {
                    ReadRestaurantFromList(restaurantList, function(speech, reprompt) {
                        callback(null, null, speech, reprompt, restaurantList);
                    });
                }
                else
                {
                    speech = "I'm sorry, I didn't find any " + ParamsToText(params);

                    callback(null, speech, null, null, restaurantList);
                }
            }
        });
    },
    ReadRestaurantsFromList : function(restaurantList, callback) {
        var speech, reprompt;
        var toRead = Math.min(restaurantList.restaurants.length - restaurantList.read, 5);

        // OK, read the names as allow them to ask for more detail on any choice
        speech = "Reading " + toRead + " restaurants. ";
        reprompt = "You can ask for more details on any of these restaurants by saying that restaurant number";
        reprompt += ((restaurantList.restaurants.length - restaurantList.read > 5) ? "or say More to hear more results. " : ". ");
        speech += reprompt;

        var i;
        var ordinals = ["First", "Second", "Third", "Fourth", "Fifth"];
        for (i = 0; i < toRead; i++)
        {
            speech += (" " + ordinals[i] + " result is " + restaurantList.restaurants[restaurantList.read + i].name + ".");
        }
        restaurantList.read += toRead;

        // Return the speech and reprompt text
        callback(speech, reprompt);
    },
    ReadResturantDetails : function(restaurantList, indexToRead, callback) {
        // I have to have read some results first
        if (restaurantList.restaurants.length == 0)
        {
            callback(null, "Please ask for a set of restaurants before asking for details them.", null, null);
        }
        else if (restaurantList.read == 0)
        {
            callback(null, "Please ask to start reading the list before asking for details about restaurants on the list.", null, null);
        }
        else
        {
            // Let's figure out where exactly we should be reading - read is what we've read up thru
            var toRead;

            toRead = (5 * Math.floor((restaurantList.read - 1) / 5)) + indexToRead - 1;

            if (toRead >= restaurantList.restaurants.length)
            {
                var speechReprompt, reprompt;

                speechReprompt = indexToRead + " is not a valid option to read.";
                reprompt = "Please ask for a valid number or say repeat to repeat the list.";
                speechReprompt += (" " + reprompt);
                callback(null, null, speechReprompt, reprompt);
            }
            else
            {
                // OK, this should be good
                var restaurant = restaurantList.restaurants[toRead];
                var priceList = ["cheap", "moderate", "spendy", "splurge"];

                // Read information about the restaurant
                speech = restaurant.name + " is located at " + restaurant.location.address1 + " in " + restaurant.location.city;
                speech += (". It has a Yelp rating of " + restaurant.rating + " based on " + restaurant.review_count + " reviews.");
                if (restaurant.price)
                {
                    speech += (" It is a " + priceList[restaurant.price - 1] + " option.");
                }
                if (restaurant.phone)
                {
                    speech += (" The phone number is " + restaurant.phone);
                }
                callback(speech);
            }
        }
    }
};

function SendYelpRequest(path, callback)
{
    // Canned response if you want to bypass the Yelp call
    if (config.noYelp)
    {
        var cannedResponse = {total: 6, businesses: [
                        {name: "One Place", phone: "4255551212", location: {address1: "1 Main St", city: "Seattle" }, rating: "3", review_count: "12", is_closed: false, price: "$$", distance: 1000},
                        {name: "Two Place", phone: "4255551212", location: {address1: "2 Main St", city: "Seattle" }, rating: "3.5", review_count: "12", is_closed: false, price: "$$", distance: 1000},
                        {name: "Three Place", phone: "4255551212", location: {address1: "3 Main St", city: "Seattle" }, rating: "4", review_count: "12", is_closed: false, price: "$$", distance: 1000},
                        {name: "Four Place", phone: "4255551212", location: {address1: "4 Main St", city: "Seattle" }, rating: "4.5", review_count: "12", is_closed: false, price: "$$", distance: 1000},
                        {name: "Five Place", phone: "4255551212", location: {address1: "5 Main St", city: "Seattle" }, rating: "2.5", review_count: "12", is_closed: false, price: "$$", distance: 1000},
                        {name: "Six Place", phone: "4255551212", location: {address1: "6 Main St", city: "Seattle" }, rating: "3", review_count: "12", is_closed: false, price: "$$", distance: 1000}
                    ]};

        callback(null, cannedResponse);
        return;
    }

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
    SendYelpRequest(urlPath, function(error, restaurantList) {
        if (error) {
            callback(error, null);
        }
        else {
            // Save fields we care about from Yelp, also note the total number
            // of restaurants and how many we've read to the user so far (0)
            var results = {total: restaurantList.total, read: 0, restaurants: []};

            restaurantList.businesses.forEach(restaurant => {
                let myResult = {};

                myResult.name = restaurant.name;
                myResult.phone = restaurant.phone;
                myResult.location = restaurant.location;
                myResult.rating = restaurant.rating;
                myResult.review_count = restaurant.review_count;
                myResult.is_closed = restaurant.is_closed;
                myResult.price = (restaurant.price) ? Math.min(restaurant.price.length, 4) : 0;
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
