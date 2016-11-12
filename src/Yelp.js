/*
 * Source file that connects to Yelp
 */

var config = require("./config");
const https = require('https');
const querystring = require('querystring');
var categoryList = require('./categories');

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

function GetRestaurantList(location, latitude, longitude, categories, callback)
{
    var urlPath = "/v3/businesses/search?term=restaurants&";
    var params = {};

    // BUGBUG - Should we require location?
    if (location)
    {
        params.location = location;
    }
    if (categories)
    {
        params.categories = categories;
    }
    if (latitude && longitude)
    {
        params.latitude = latitude;
        params.longitude = longitude;
    }
    urlPath += querystring.stringify(params)

    SendYelpRequest(urlPath, function(error, response) {
        if (error) {
            callback(error, null);
        }
        else {
            // Do some processing first
            callback(error, response);
        }
    });
}

GetRestaurantList("Seattle", null, null, "afghani", function(error, response) {
    if (error) {
        console.log("Error " + error);
    } else {
        console.log(JSON.stringify(response));
    }
});
