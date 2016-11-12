/*
 * Source file that connects to Yelp
 */

var config = require("./config");
const https = require('https');

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

SendYelpRequest("/v3/autocomplete?text=del&latitude=37.786882&longitude=-122.399972", function(error, response) {
    if (error) {
        console.log("Error " + error);
    } else {
        console.log(JSON.stringify(response));
    }
});