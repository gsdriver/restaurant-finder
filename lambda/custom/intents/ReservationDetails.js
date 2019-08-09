//
// Manages Reserve flow
//

'use strict';

const ri = require('@jargon/alexa-skill-sdk').ri;

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
      console.log(slots);

      // Need to handle MO, AF, EV, NI
      const time = slots.ReservationTime.value.split(':');
      const date = new Date();
      date.setHours(time[0]);
      if (time.length > 1) {
        date.setMinutes(time[1]);
      }
      if (date > Date.now()) {
        date.setHours(date.getHours() + 12);
      }

      // OK, let's make the reservation
      const restaurant = attributes.lastResponse.restaurants[attributes.lastResponse.details];
      const reservationDirective = {
         'type': 'Connections.StartConnection',
         'uri': 'connection://AMAZON.ScheduleFoodEstablishmentReservation/1',
         'input': {
            '@type': 'ScheduleFoodEstablishmentReservationRequest',
            '@version': '1',
            'startTime': date.toISOString(), //'2018-04-08T01:15:46Z'
            'partySize': parseInt(slots.PartySize.value, 10),
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
          'token': 'read.' + attributes.lastResponse.details,
       };

      // Done with search - now let's start the filtering
      console.log(JSON.stringify(reservationDirective));
      return handlerInput.responseBuilder
        .addDirective(reservationDirective)
        .getResponse();
    }
  },
};
