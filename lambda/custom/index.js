/*
 * MIT License

 * Copyright (c) 2016 Garrett Vargas

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

const Alexa = require('alexa-sdk');
const Launch = require('./intents/Launch');
const CanFulfill = require('./intents/CanFulfill');
const FindRestaurant = require('./intents/FindRestaurant');
const ReadList = require('./intents/ReadList');
const Details = require('./intents/Details');
const Back = require('./intents/Back');
const Repeat = require('./intents/Repeat');
const Help = require('./intents/Help');
const Exit = require('./intents/Exit');
const resources = require('./resources');
const utils = require('./utils');

const APP_ID = 'amzn1.ask.skill.4c848d38-347c-4e03-b908-42c6af6c207d';

const detailsHandlers = Alexa.CreateStateHandler('DETAILS', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'FindRestaurantIntent': FindRestaurant.handleIntent,
  'ReadListIntent': ReadList.handleIntent,
  'BackIntent': Back.handleIntent,
  'AMAZON.PreviousIntent': Back.handleIntent,
  'AMAZON.MoreIntent': Repeat.handleIntent,
  'AMAZON.NextIntent': Details.handleNextIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    console.log('Session ended!');
    this.attributes.sessionCount = (this.attributes.sessionCount + 1) || 1;
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    this.response.speak(this.t('UNKNOWN_INTENT')).listen(this.t('UNKNOWN_INTENT_REPROMPT'));
    this.emit(':responseReady');
  },
});

const listHandlers = Alexa.CreateStateHandler('LIST', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'FindRestaurantIntent': FindRestaurant.handleIntent,
  'ReadListIntent': ReadList.handleIntent,
  'DetailsIntent': Details.handleIntent,
  'BackIntent': Back.handleIntent,
  'ElementSelected': Details.handleIntent,
  'AMAZON.PreviousIntent': Back.handleIntent,
  'AMAZON.MoreIntent': ReadList.handleIntent,
  'AMAZON.NextIntent': ReadList.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    console.log('Session ended!');
    this.attributes.sessionCount = (this.attributes.sessionCount + 1) || 1;
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    this.response.speak(this.t('UNKNOWN_INTENT')).listen(this.t('UNKNOWN_INTENT_REPROMPT'));
    this.emit(':responseReady');
  },
});

const resultHandlers = Alexa.CreateStateHandler('RESULTS', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'FindRestaurantIntent': FindRestaurant.handleIntent,
  'ReadListIntent': ReadList.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    console.log('Session ended!');
    this.attributes.sessionCount = (this.attributes.sessionCount + 1) || 1;
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    this.response.speak(this.t('UNKNOWN_INTENT')).listen(this.t('UNKNOWN_INTENT_REPROMPT'));
    this.emit(':responseReady');
  },
});

const handlers = {
  'NewSession': function() {
    this.attributes.lastRun = Date.now();
    this.attributes.userLocale = this.event.request.locale;

    // Send on this request
    if (this.event.request.type === 'IntentRequest') {
      // Clear the last search if this is a FindRestaurantIntent
      if (this.event.request.intent.name == 'FindRestaurantIntent') {
        utils.clearState(this);
      }
      this.emit(this.event.request.intent.name);
    } else {
      this.emit('LaunchRequest');
    }
  },
  'LaunchRequest': Launch.handleIntent,
  'FindRestaurantIntent': FindRestaurant.handleIntent,
  'ReadListIntent': ReadList.handleIntent,
  'DetailsIntent': Details.handleIntent,
  'AMAZON.FallbackIntent': Help.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    console.log('Session ended!');
    this.attributes.sessionCount = (this.attributes.sessionCount + 1) || 1;
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    this.response.speak(this.t('UNKNOWN_INTENT')).listen(this.t('UNKNOWN_INTENT_REPROMPT'));
    this.emit(':responseReady');
  },
};

if (process.env.DASHBOTKEY) {
  const dashbot = require('dashbot')(process.env.DASHBOTKEY).alexa;
  exports.handler = dashbot.handler(runSkill);
} else {
  exports.handler = runSkill;
}

function runSkill(event, context, callback) {
  const AWS = require('aws-sdk');
  AWS.config.update({region: 'us-east-1'});

  // If this is a CanFulfill, handle this separately
  if (event.request && (event.request.type == 'CanFulfillIntentRequest')) {
    CanFulfill.check(event, (response) => {
      context.succeed(response);
    });
    return;
  }

  const alexa = Alexa.handler(event, context);

  if (!process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }
  alexa.appId = APP_ID;
  alexa.resources = resources.languageStrings;
  alexa.registerHandlers(resultHandlers, detailsHandlers, listHandlers, handlers);
  alexa.dynamoDBTableName = 'RestaurantFinder';
  alexa.execute();
}
