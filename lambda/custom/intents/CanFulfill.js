//
// Checks whether we can fulfill this intent
// Note that this is processed outside of the normal Alexa SDK
// So we cannot use alexa-sdk functionality here
//

'use strict';

const AWS = require('aws-sdk');
const yelp = require('../api/Yelp');
const utils = require('../utils');

module.exports = {
  check: function(event, callback) {
    const attributes = {};
    const noSlotIntents = ['AMAZON.FallbackIntent', 'AMAZON.HelpIntent',
        'AMAZON.StopIntent', 'AMAZON.CancelIntent'];

    // Default to a negative response
    const response = {
    'version': '1.0',
      'response': {
        'canFulfillIntent': {
          'canFulfill': 'NO',
          'slots': {},
        },
      },
    };

    // If this is one we understand regardless of attributes,
    // then we can just return immediately
    if (noSlotIntents.indexOf(event.request.intent.name) > -1) {
      execute(true);
    } else {
      // OK we're going to have to load state to see if this is valid
      let userId;
      if (event.context && event.context.System && event.context.System.user
        && event.context.System.user.userId) {
        userId = event.context.System.user.userId;
      } else if (event.session && event.session.user && event.session.user.userId) {
        userId = event.session.user.userId;
      }

      if (userId) {
        const doc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
        doc.get({TableName: 'RestaurantFinder',
                ConsistentRead: true,
                Key: {userId: userId}},
                (err, data) => {
          if (err || (data.Item === undefined)) {
            if (err) {
              console.log('Error reading attributes ' + err);
            }
          } else {
            Object.assign(attributes, data.Item.mapAttr);
          }

          execute();
        });
      } else {
        execute();
      }
    }

    function execute(isValid) {
      let valid = isValid;

      if (!valid) {
        switch (event.request.intent.name) {
          case 'FindRestaurantIntent':
            if (event.request.intent.slots) {
              const params = utils.buildYelpParameters(event.request.intent);
              yelp.getRestaurantList(params.yelpParams, (error, restaurantList) => {
                if (restaurantList) {
                  valid = true;
                }
                finalize(valid);
              });
              return;
            }
            break;
          case 'ReadListIntent':
            // We need to have restaurants to read
            valid = (attributes.lastResponse
                && attributes.lastResponse.restaurants
                && attributes.lastResponse.restaurants.length);
            break;
          case 'DetailsIntent':
            // Need to have lastResponse and be in LIST state
            if (attributes.lastResponse && (attributes.STATE == 'LIST')) {
              // Make sure there's a valid RestaurantID slot
              if (event.request.intent.slots && event.request.intent.slots.RestaurantID
                && event.request.intent.slots.RestaurantID.value) {
                const index = parseInt(event.request.intent.slots.RestaurantID.value);
                valid = (!isNaN(index) && (index < attributes.lastResponse.restaurants.length));
              }
            }
            break;
          default:
            // Don't know this one
            break;
        }
      }
      finalize(valid);

      function finalize(validRequest) {
        if (validRequest) {
          // We can fulfill it - all slots are good
          let slot;

          response.response.canFulfillIntent.canFulfill = 'YES';
          for (slot in event.request.intent.slots) {
            if (slot) {
              response.response.canFulfillIntent.slots[slot] =
                  {'canUnderstand': 'YES', 'canFulfill': 'YES'};
            }
          }
        }

        console.log('CanFulfill: ' + JSON.stringify(response));
        callback(response);
      }
    }
  },
};
