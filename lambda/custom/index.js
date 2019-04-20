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

const Alexa = require('ask-sdk');
const Launch = require('./intents/Launch');
const CanFulfill = require('./intents/CanFulfill');
const FindRestaurant = require('./intents/FindRestaurant');
const ReadList = require('./intents/ReadList');
const Details = require('./intents/Details');
const Next = require('./intents/Next');
const Back = require('./intents/Back');
const Repeat = require('./intents/Repeat');
const Help = require('./intents/Help');
const Exit = require('./intents/Exit');
const SessionEnd = require('./intents/SessionEnd');
const Unhandled = require('./intents/Unhandled');
// const utils = require('./utils');
const ssmlCheck = require('ssml-check-core');
const {ri, JargonSkillBuilder} = require('@jargon/alexa-skill-sdk');

const requestInterceptor = {
  process(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const event = handlerInput.requestEnvelope;

    if (Object.keys(sessionAttributes).length === 0) {
      // No session attributes - so get the persistent ones
      return attributesManager.getPersistentAttributes()
        .then((attributes) => {
          attributes.temp = {};
          attributes.lastRun = Date.now();
          attributes.playerLocale = event.request.locale;
          attributes.sessions = (attributes.sessions + 1) || 1;
          attributesManager.setSessionAttributes(attributes);
        });
    } else {
      return Promise.resolve();
    }
  },
};

const saveResponseInterceptor = {
  process(handlerInput) {
    const response = handlerInput.responseBuilder.getResponse();
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if (response) {
      return Promise.resolve().then(() => {
      // return utils.drawTable(handlerInput).then(() => {
        if (response.shouldEndSession) {
          // We are meant to end the session
          return SessionEnd.handle(handlerInput);
        } else {
          // Save the response and reprompt for repeat
          if (response.outputSpeech && response.outputSpeech.ssml) {
            return ssmlCheck.verifyAndFix(response.outputSpeech.ssml, {platform: 'alexa'}, (result) => {
              if (result.errors) {
                console.log(JSON.stringify(result.errors));
              }
              if (result.fixedSSML) {
                response.outputSpeech.ssml = result.fixedSSML;
              }

              // Note the response
              if (!process.env.NOLOG) {
                console.log(JSON.stringify(response));
              }

              // Save the last response and reprompt with stripped <speak> tags
              let lastResponse = response.outputSpeech.ssml;
              lastResponse = lastResponse.replace('<speak>', '');
              lastResponse = lastResponse.replace('</speak>', '');
              attributes.temp.lastResponse = lastResponse;

              if (response.reprompt && response.reprompt.outputSpeech
                && response.reprompt.outputSpeech.ssml) {
                let lastReprompt = response.reprompt.outputSpeech.ssml;
                lastReprompt = lastReprompt.replace('<speak>', '');
                lastReprompt = lastReprompt.replace('</speak>', '');
                attributes.temp.lastReprompt = lastReprompt;
              }
            });
          } else {
            return Promise.resolve();
          }
        }
      });
    } else {
      return Promise.resolve();
    }
  },
};

const ErrorHandler = {
  canHandle(handlerInput, error) {
    console.log(error.stack);
    return error.name.startsWith('AskSdk');
  },
  handle(handlerInput, error) {
    return handlerInput.jrb
      .speak(ri('SKILL_ERROR'))
      .getResponse();
  },
};

if (process.env.DASHBOTKEY) {
  const dashbot = require('dashbot')(process.env.DASHBOTKEY).alexa;
  exports.handler = dashbot.handler(runSkill);
} else {
  exports.handler = runSkill;
}

function runSkill(event, context, callback) {
  const skillBuilder = new JargonSkillBuilder().wrap(Alexa.SkillBuilders.custom());

  if (!process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }

  // If this is a CanFulfill, handle this separately
  if (event.request && (event.request.type == 'CanFulfillIntentRequest')) {
    callback(null, CanFulfill.check(event));
    return;
  }

  const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
  const dbAdapter = new DynamoDbPersistenceAdapter({
    tableName: 'RestaurantFinder',
    partitionKeyName: 'userId',
    attributesName: 'mapAttr',
  });
  const skillFunction = skillBuilder.addRequestHandlers(
      Launch,
      Repeat,
      FindRestaurant,
      ReadList,
      Details,
      Next,
      Back,
      Help,
      Exit,
      SessionEnd,
      Unhandled
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(requestInterceptor)
    .addResponseInterceptors(saveResponseInterceptor)
    .withPersistenceAdapter(dbAdapter)
    .withApiClient(new Alexa.DefaultApiClient())
    .withSkillId('amzn1.ask.skill.4c848d38-347c-4e03-b908-42c6af6c207d')
    .lambda();
  skillFunction(event, context, (err, response) => {
    callback(err, response);
  });
}

/*
const handlers = {
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
};
*/
