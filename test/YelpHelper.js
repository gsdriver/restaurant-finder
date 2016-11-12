/*
 * Source file that connects to Yelp
 */

var config = require("./config");
var querystring = require('querystring');
var http = require('http');

function GetAccessToken(callback)
{
    var fullbody = "";
    var post_data = querystring.stringify({
        'grant_type' : 'client_credentials',
        'client_id': config.appID,
        'client_secret': config.appSecret,
    });
    var post_options = {
      host: 'api.yelp.com',
      port: '8080',
      path: '/oauth2/token',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
      }
    };

    // Set up the request
    var post_req = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {fullbody += chunk.toString();});
        res.on('end', () => callback(null, fullbody));
    });

  // post the data
  post_req.write(post_data);
  post_req.end();
}

GetAccessToken(function(error, response) {
    if (error) {
        console.log("Error " + JSON.stringify(error));
    } else {
        console.log(response);
    }
});

function BuildCategoryList()
{
    var restList = [];

    cat.forEach(category => {
        // Is this a US restaurant?
        if (category.parents.indexOf("restaurants") > -1) {
            // Is it in US (or blacklist US)?
            var include = true;

            if (category.country_blacklist && category.country_blacklist.indexOf("US") > -1)
            {
                // Nope, skip it
                include = false;
            } else if (category.country_whitelist && category.country_whitelist.indexOf("US") == -1)
            {
                // Nope, skip it
                include = false;
            }

            // OK, we can include it
            restList.push({alias: category.alias, title: category.title});
        }
    });

    return restList;
}
