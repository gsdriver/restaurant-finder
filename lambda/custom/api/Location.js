/*
 * Source file that connects to Alexa for location details
 */

'use strict';

const https = require('https');

module.exports = {
  getDeviceLocation: function(handlerInput) {
    const event = handlerInput.requestEnvelope;

    // Allows us to shortcircuit trying to get location
    if (process.env.DONTGETLOCATION) {
      return Promise.resolve();
    }

    const headers = {'Authorization': 'Bearer ' + event.context.System.apiAccessToken};
    const options = {hostname: event.context.System.apiEndpoint.replace('https://', ''),
      port: 443,
      path: '/v1/devices/' + event.context.System.device.deviceId + '/settings/address/countryAndPostalCode',
      method: 'GET',
      headers: headers};

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
          if (process.env.FAKELOCATION) {
            resolve({postalCode: '98074'});
          } else {
            reject('Unable to call endpoint');
          }
        }
      });

      req.end();
      req.on('error', (e) => {
        console.log(e.stack);
        reject(e);
      });
    });
  },
};
