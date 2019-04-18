var mainApp = require('./index');

const attributeFile = 'attributes.txt';

const AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: 'us-east-1',
});

AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const sessionId = "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fb4";
const LOCALE = 'en-CA';
const APPID = 'amzn1.ask.skill.4c848d38-347c-4e03-b908-42c6af6c207d';
const APITOKEN = '';

const fs = require('fs');

function BuildEvent(argv)
{
    // Templates that can fill in the intent
    var findRestaurant = {"name": "FindRestaurantIntent", "slots": {"FirstDescriptor": {"name": "FirstDescriptor", "value": ""},
                    "SecondDescriptor": {"name": "SecondDescriptor", "value": ""},
                    "ThirdDescriptor": {"name": "ThirdDescriptor", "value": ""},
                    "Location": {"name": "Location", "value": ""}}};
    var readList = {"name": "ReadListIntent", "slots": {}};
    var backIntent = {"name": "AMAZON.PreviousIntent", "slots": {}};
    var restaurantDetails = {"name": "DetailsIntent", "slots": {"RestaurantID": {"name": "RestaurantID", "value": ""}}};
    var repeatIntent = {"name": "AMAZON.RepeatIntent", "slots": {}};
    var help = {"name": "AMAZON.HelpIntent", "slots": {}};
    var stop = {"name": "AMAZON.StopIntent", "slots": {}};

    var lambda = {
      "session": {
        "sessionId": sessionId,
        "application": {
          "applicationId": APPID
        },
        "attributes": {},
        "user": {
          "userId": "not-amazon",
        },
        "new": false
      },
      "context": {
        "AudioPlayer": {
          "playerActivity": "IDLE"
        },
        "Display": {},
        "System": {
          "application": {
            "applicationId": APPID
          },
          "user": {
            "userId": "not-amazon"
          },
          "device": {
            "deviceId": "amzn1.ask.device.AFD2MDKY4WIZW3HGZ277CUWUZEFNDPLO4JY3HDUCWFGN5CWX3LGTS5NANWJPJEKYVUMFU3IXR3LGTZQOU3GQMCSMRJTLEGKVKCAOZ5UPR7VRMI5BQ3HDELM5RA2EQA7IHDXG5SVUAT3FO3ASFNA7RX2NCC2Q",
            "supportedInterfaces": {
              "AudioPlayer": {},
              "Display": {
                "templateVersion": "1.0",
                "markupVersion": "1.0"
              }
            }
          },
          "apiEndpoint": "https://api.amazonalexa.com",
          "apiAccessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJhdWQiOiJodHRwczovL2FwaS5hbWF6b25hbGV4YS5jb20iLCJpc3MiOiJBbGV4YVNraWxsS2l0Iiwic3ViIjoiYW16bjEuYXNrLnNraWxsLjRjODQ4ZDM4LTM0N2MtNGUwMy1iOTA4LTQyYzZhZjZjMjA3ZCIsImV4cCI6MTUyMzIzNjExNCwiaWF0IjoxNTIzMjMyNTE0LCJuYmYiOjE1MjMyMzI1MTQsInByaXZhdGVDbGFpbXMiOnsiY29uc2VudFRva2VuIjpudWxsLCJkZXZpY2VJZCI6ImFtem4xLmFzay5kZXZpY2UuQUZEMk1ES1k0V0laVzNIR1oyNzdDVVdVWkVGTkRQTE80SlkzSERVQ1dGR041Q1dYM0xHVFM1TkFOV0pQSkVLWVZVTUZVM0lYUjNMR1RaUU9VM0dRTUNTTVJKVExFR0tWS0NBT1o1VVBSN1ZSTUk1QlEzSERFTE01UkEyRVFBN0lIRFhHNVNWVUFUM0ZPM0FTRk5BN1JYMk5DQzJRIiwidXNlcklkIjoiYW16bjEuYXNrLmFjY291bnQuQUZCQzRSVk8yT1NVNlpZRlpPRlNJT0lVSU1JRkczSkFKVFpPM01IM1YzTkJES1RXUTVaM0dYWkhQUEo1WEJRMkZDSUdSWTVKU081RU1XVk82QUlXMjdTT05NT0xGRExEWVNTWE43NVhPWURRQTU1WU1FM0FSTzJNUVRWR1FEQUdNUjZTVlNVTTZGSjVWR0JJVEFBUTROQ1M0TUFLWVdKSVFTV1NXVTRCSDVJM0JZSVZGTFJSMkpOUlVGWTVaQTRCNFU0VkJTSDdCN0tDQU1JIn19.T8olySoD7wEBc3zIU12wdcloMNniv8povyCTr_dIENqpyk8shf9dI2lj4KiahQ0gwL5R7TX6b2M2ufXnxytdgJauYU5jRtxQ7jw-TTSzlQVzQxWlqJ0It__6pYGnX86-y44781WAJJU8VYNBkSzY8qJbg1PMTaiyQ37QJGClEgWOccEqAOHcESvYwkQgBUkfLXRpGoxnm8D9JCORjrCPRtX6cT7eG0U88NULfp4QF4FkDG2hGn2TBFc0GRbmo7k8awddjRFDQjMmrOerrZ-A83OGYTQiOtW4Nla1xPrlioHWxH09ij2FZ6GZDVnFMfkeLIV1Suq5k_mJNbQI-aezHw"
        }
      },
      "request": {
        "type": "IntentRequest",
        "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
        "locale": LOCALE,
        "timestamp": "2016-11-03T21:31:08Z",
        "intent": {}
      },
      "version": "1.0"
    };

    var openEvent = {
      "session": {
        "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
        "application": {
          "applicationId": APPID
        },
        "user": {
          "userId": "not-amazon",
        },
        "new": true
      },
      "request": {
        "type": "LaunchRequest",
        "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
        "locale": LOCALE,
        "timestamp": "2016-11-03T21:31:08Z",
        "intent": {}
      },
      "version": "1.0",
       "context": {
         "AudioPlayer": {
           "playerActivity": "IDLE"
         },
         "Display": {},
         "System": {
           "application": {
             "applicationId": APPID
           },
           "user": {
             "userId": "not-amazon",
           },
           "device": {
             "deviceId": "not-amazon",
             "supportedInterfaces": {
               "AudioPlayer": {},
               "Display": {
                 "templateVersion": "1.0",
                 "markupVersion": "1.0"
               }
             }
           },
           "apiEndpoint": "https://api.amazonalexa.com",
           "apiAccessToken": APITOKEN,
         }
       },
    };

    // If there is no argument, then we'll just return
    if (argv.length <= 2)
    {
        console.log("I need some parameters");
        return null;
    }
    else if (argv[2] == "find")
    {
        lambda.request.intent = findRestaurant;
        if (argv.length > 3)
        {
            // Special value of none means don't use a location at all
            if (argv[3] != "none")
            {
                findRestaurant.slots.Location.value = argv[3];
            }
        }
        if (argv.length > 4)
        {
            findRestaurant.slots.FirstDescriptor.value = argv[4];
        }
        if (argv.length > 5)
        {
            findRestaurant.slots.SecondDescriptor.value = argv[5];
        }
        if (argv.length > 6)
        {
            findRestaurant.slots.ThirdDescriptor.value = argv[6];
        }
    }
    else if (argv[2] == "readlist")
    {
        lambda.request.intent = readList;
    }
    else if (argv[2] == "back")
    {
        lambda.request.intent = backIntent;
    }
    else if (argv[2] == "details")
    {
        lambda.request.intent = restaurantDetails;
        restaurantDetails.slots.RestaurantID.value = (argv.length > 3) ? argv[3] : 1;
    }
    else if (argv[2] == "repeat")
    {
        lambda.request.intent = repeatIntent;
    }
    else if (argv[2] == "help")
    {
        lambda.request.intent = help;
    }
    else if (argv[2] == "stop")
    {
        lambda.request.intent = stop;
    }
    else if (argv[2] == "open")
    {
        // Return the launch request
        return openEvent;
    }
    else
    {
        console.log(argv[2] + " was not valid");
        return null;
    }

    // If there is an attributes.txt file, read the attributes from there
    const fs = require('fs');
    if (fs.existsSync(attributeFile)) {
      data = fs.readFileSync(attributeFile, 'utf8');
      if (data) {
        lambda.session.attributes = JSON.parse(data);
        openEvent.session.attributes = JSON.parse(data);
      }
    }

    return lambda;
}

function ssmlToText(ssml) {
  let text = ssml;

  // Replace break with ...
  text = text.replace(/<break[^>]+>/g, ' ... ');

  // Remove all other angle brackets
  text = text.replace(/<\/?[^>]+(>|$)/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// Simple response - just print out what I'm given
function myResponse(appId) {
  this._appId = appId;
}

function myResponse(err, result) {
  // Write the last action
  fs.writeFile('lastResponse.txt', JSON.stringify(result), (err) => {
    if (err) {
      console.log('ERROR; ' + err.stack);
    } else if (result) {
      if (result.sessionAttributes) {
        // Output the attributes
        const fs = require('fs');
        fs.writeFile(attributeFile, JSON.stringify(result.sessionAttributes), (err) => {
          if (err) {
            console.log(err);
          }
        });
        if (!process.env.NOLOG) {
          console.log('"attributes": ' + JSON.stringify(result.sessionAttributes));
        }
      }
      if (!result.response || !result.response.outputSpeech) {
        console.log('RETURNED ' + JSON.stringify(result));
      } else {
        if (result.response.outputSpeech.ssml) {
          console.log('AS SSML: ' + result.response.outputSpeech.ssml);
          console.log('AS TEXT: ' + ssmlToText(result.response.outputSpeech.ssml));
        } else {
          console.log(result.response.outputSpeech.text);
        }
        if (result.response.card && result.response.card.content) {
          console.log('Card Content: ' + result.response.card.content);
        }
        console.log('The session ' + ((!result.response.shouldEndSession) ? 'stays open.' : 'closes.'));
      }
    }
  });
}

// Build the event object and call the app
if ((process.argv.length == 3) && (process.argv[2] == 'clear')) {
  // Clear is a special case - delete this entry from the DB and delete the attributes.txt file
  dynamodb.deleteItem({TableName: 'RestaurantFinder', Key: { userId: {S: 'not-amazon'}}}, function (error, data) {
    console.log("Deleted " + error);
    if (fs.existsSync(attributeFile)) {
      fs.unlinkSync(attributeFile);
    }
  });
} else {
  var event = BuildEvent(process.argv);
  if (event) {
      mainApp.handler(event, null, myResponse);
  }
}
