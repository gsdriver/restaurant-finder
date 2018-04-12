/*
 * Source file that connects to Alexa for location details
 */

'use strict';

const https = require('https');

module.exports = {
  getDeviceLocation: function(context, callback) {
    const headers = {'Authorization': 'Bearer ' + context.event.context.System.apiAccessToken};
    const options = {hostname: context.event.context.System.apiEndpoint.replace('https://', ''),
      port: 443,
      path: '/v1/devices/' + context.event.context.System.device.deviceId + '/settings/address/countryAndPostalCode',
      method: 'GET',
      headers: headers};

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
      console.log(e.stack);
      callback(e, null);
    });
  },
};
