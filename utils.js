//
// Utility functionals
//

/*
 * Exported functions
 */

module.exports = {
  emitResponse: function(context, error, response, speech, reprompt, cardTitle, cardText) {
    if (error) {
      console.log('Speech error: ' + error);
      context.response.speak('Sorry, something went wrong')
        .listen('What can I help you with?');
    } else if (response) {
      context.attributes.sessionCount = (context.attributes.sessionCount + 1) || 1;
      context.response.speak(response);
    } else if (cardTitle) {
      context.response.speak(speech)
        .listen(reprompt)
        .cardRenderer(cardTitle, cardText);
    } else {
      context.response.speak(speech)
        .listen(reprompt);
    }

    context.emit(':responseReady');
  },
  // Cache functions
  readLocation: function(location) {
    // If the location is a ZIP code, spell it out
    let retval = location;

    if ((location.length == 5) && !isNaN(parseInt(location))) {
      // This is a ZIP code
      retval = location.substring(0, 1) + ' ' + location.substring(1, 2) + ' ' + location.substring(2, 3) + ' ' +
                  location.substring(3, 4) + ' ' + location.substring(4, 5);
    }

    return retval;
  },
  cleanString: function(str) {
    return str.replace(/&/g, 'and');
  },
};
