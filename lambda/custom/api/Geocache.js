/*
 * Source file that connects to Google Geocache API
 */

'use strict';

const https = require('https');
const querystring = require('querystring');

module.exports = {
  getCityFromPostalCode: function(postalcode) {
    // If you don't have a key, return undefined
    if (!process.env.GEOCACHEKEY) {
      console.log('Set a key for this API');
      return Promise.resolve();
    }

    const params = {
      address: postalcode,
      key: process.env.GEOCACHEKEY,
    };
    const urlPath = '/maps/api/geocode/json?' + querystring.stringify(params);
    return sendRequest(urlPath)
    .then((result) => {
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

      return city;
    }).catch((error) => {
      console.log('getCityFromPostalCode error ' + error);
      return;
    });
  },
  getTimeZoneFromLatLong: function(lat, long, date) {
    // If you don't have a key, return undefined
    if (!process.env.GEOCACHEKEY) {
      console.log('Set a key for this API');
      return Promise.resolve();
    }

    const params = {
      location: lat + ',' + long,
      timestamp: (Math.round((date.getTime())/1000)).toString(),
      key: process.env.GEOCACHEKEY,
    };
    const urlPath = '/maps/api/timezone/json?' + querystring.stringify(params);
    console.log(urlPath);
    return sendRequest(urlPath)
    .then((result) => {
      console.log(result);
      if (result.data && result.data.timeZoneId) {
        return result.data.timeZoneId;
      }

      return '';
    }).catch((error) => {
      console.log('getTimeZoneFromLatLong error ' + error);
      return;
    });
  },
};

function sendRequest(path) {
  const options = {hostname: 'maps.googleapis.com', port: 443, path: path, method: 'GET'};

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode == 200) {
        // Process the response
        let fulltext = '';
        res.on('data', (data) => {
          fulltext += data;
        });
        res.on('end', () => resolve(JSON.parse(fulltext)));
      } else {
        // Sorry, there was an error calling the HTTP endpoint
        reject('Unable to call endpoint');
      }
    });

    req.end();
    req.on('error', (e) => {
      reject(e);
    });
  });
}
