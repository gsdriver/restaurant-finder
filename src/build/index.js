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
const utils = require('./utils');
const Launch = require('./intents/Launch');
const FindRestaurant = require('./intents/FindRestaurant');
const SetLocation = require('./intents/SetLocation');
const ReadList = require('./intents/ReadList');
const Details = require('./intents/Details');
const Back = require('./intents/Back');
const Repeat = require('./intents/Repeat');
const Help = require('./intents/Help');
const Exit = require('./intents/Exit');

const APP_ID = 'amzn1.ask.skill.4c848d38-347c-4e03-b908-42c6af6c207d';

const handlers = {
  'NewSession': function() {
    this.emit('LaunchRequest');
  },
  'LaunchRequest': Launch.handleIntent,
  'FindRestaurantIntent': FindRestaurant.handleIntent,
  'SetLocationIntent': SetLocation.handleIntent,
  'ReadListIntent': ReadList.handleIntent,
  'DetailsIntent': Details.handleIntent,
  'AMAZON.PreviousIntent': Back.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    utils.emitResponse(this, null, null,
          res.strings.UNKNOWN_INTENT, res.strings.UNKNOWN_INTENT_REPROMPT);
  },
};

if (process.env.DASHBOTKEY) {
  const dashbot = require('dashbot')(process.env.DASHBOTKEY).alexa;
  exports.handler = dashbot.handler(runSkill);
} else {
  exports.handler = runSkill;
}

function runSkill(event, context, callback) {
  AWS.config.update({region: 'us-east-1'});

  const alexa = Alexa.handler(event, context);

  alexa.appId = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.dynamoDBTableName = 'RestaurantFinder';
  alexa.execute();
}
