/*
 * Source file that connects to Google Geocache API
 */

'use strict';

const https = require('https');
const querystring = require('querystring');

module.exports = {
  getCityFromPostalCode: function(postalcode, callback) {
    // If you don't have a key, return undefined
    if (!process.env.GEOCACHEKEY) {
      console.log('Set a key for this API');
      callback('No API key');
      return;
    }

    const params = {
      address: postalcode,
      key: process.env.GEOCACHEKEY,
    };
    const urlPath = '/maps/api/geocode/json?' + querystring.stringify(params);
    sendRequest(urlPath, (error, result) => {
      if (error) {
        callback(error);
      } else {
        // OK, let's get the locality name - just look at the first result
        let city;

        if (result.results && result.results[0] && result.results[0].address_components) {
          const components = result.results[0].address_components;

          components.forEach((component) => {
            if (component.types && (component.types.indexOf('locality') > -1)) {
              // This is the one we want
              city = component.long_name;
            }
          });
        }

        callback(city ? undefined : 'No locality found', city);
      }
    });
  },
};

function sendRequest(path, callback) {
  const options = {hostname: 'maps.googleapis.com', port: 443, path: path, method: 'GET'};

  const req = https.request(options, (res) => {
    if (res.statusCode == 200) {
      // Process the response
      let fulltext = '';
      res.on('data', (data) => {
        fulltext += data;
      });
      res.on('end', () => callback(null, JSON.parse(fulltext)));
    } else {
      // Sorry, there was an error calling the HTTP endpoint
      callback('Unable to call endpoint', null);
    }
  });

  req.end();
  req.on('error', (e) => {
    callback(e, null);
  });
}
