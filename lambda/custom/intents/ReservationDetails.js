//
// Manages Reserve flow
//

'use strict';

const ri = require('@jargon/alexa-skill-sdk').ri;
const geocache = require('../api/Geocache');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest')
      && (request.intent.name === 'ReserveIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const slots = event.request.intent.slots;

    if (event.request.dialogState !== 'COMPLETED') {
      // Keep collecting the information we need
      return handlerInput.responseBuilder
        .addDelegateDirective(event.request.intent)
        .getResponse();
    } else {
      // Need to handle MO, AF, EV, NI
      const literals = {
        'MO': 9,
        'AF': 13,
        'EV': 18,
        'NI': 21,
      }
      let time;

      if (literals[slots.ReservationTime.value.toUpperCase()]) {
        time = [literals[slots.ReservationTime.value.toUpperCase()]];
      } else {
        time = slots.ReservationTime.value.split(':');

        // If the hour is less than 12, they may mean PM
        // Let's just set it to PM if the hour is less than 8
        if (time[0] < 8) {
          time[0] += 12;
        }
      }

      const date = new Date();
      date.setHours(time[0]);
      if (time.length > 1) {
        date.setMinutes(time[1]);
      }

      // If the date is before now, try tomorrow instead
      if (date < Date.now()) {
        date.setDate(date.getDate() + 1);
      }

      // OK, let's make the reservation
      let partySize = parseInt(slots.PartySize.value, 10);
      if (isNaN(partySize)) {
        partySize = 2;
      }
      const restaurant = attributes.lastResponse.restaurants[attributes.lastResponse.details];
      let dateStr = date.toISOString();
      dateStr = dateStr.substr(0, dateStr.length - 5);
      dateStr += 'Z';
      const reservationDirective = {
        'type': 'Connections.StartConnection',
        'uri': 'connection://AMAZON.ScheduleFoodEstablishmentReservation/1',
        'input': {
          '@type': 'ScheduleFoodEstablishmentReservationRequest',
          '@version': '1',
          'startTime': dateStr,
          'partySize': partySize,
          'restaurant': {
            '@type': 'Restaurant',
            '@version': '1',
            'name': restaurant.name,
            'location': {
              '@type': 'PostalAddress',
              '@version': '1',
              'streetAddress': restaurant.location.address1,
              'locality': restaurant.location.city,
              'region': restaurant.location.state,
              'postalCode': restaurant.location.zipCode,
              'country': restaurant.location.country,
            }
          }
        },
      };

      return geocache.getTimeZoneFromLatLong(restaurant.latitude, restaurant.longitude, date).then((tz) => {
        // Done with search - now let's start the filtering
        console.log(JSON.stringify(reservationDirective));
        console.log(tz);
        return handlerInput.responseBuilder
          .addDirective(reservationDirective)
          .getResponse();
      });
    }
  },
};
