var mainApp = require('../index');

const attributeFile = 'attributes.txt';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const sessionId = "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fb4";

function BuildEvent(argv)
{
    // Templates that can fill in the intent
    var findRestaurant = {"name": "FindRestaurantIntent", "slots": {"FirstDescriptor": {"name": "FirstDescriptor", "value": ""},
                    "SecondDescriptor": {"name": "SecondDescriptor", "value": ""},
                    "ThirdDescriptor": {"name": "ThirdDescriptor", "value": ""},
                    "Location": {"name": "Location", "value": ""}}};
    var setLocation = {"name": "SetLocationIntent", "slots": {"Location": {"name": "Location", "value": ""}}};
    var setLocationZIP = {"name": "SetLocationIntent", "slots": {"LocationZIP": {"name": "LocationZIP", "value": ""}}};
    var readList = {"name": "ReadListIntent", "slots": {}};
    var backIntent = {"name": "AMAZON.PreviousIntent", "slots": {}};
    var restaurantDetails = {"name": "DetailsIntent", "slots": {"RestaurantID": {"name": "RestaurantID", "value": ""}}};
    var repeatIntent = {"name": "AMAZON.RepeatIntent", "slots": {}};

    var lambda = {
      "session": {
        "sessionId": sessionId,
        "application": {
          "applicationId": "amzn1.ask.skill.4c848d38-347c-4e03-b908-42c6af6c207d"
        },
        "attributes": {},
        "user": {
          "userId": "not-amazon",
        },
        "new": false
      },
      "request": {
        "type": "IntentRequest",
        "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
        "locale": "en-US",
        "timestamp": "2016-11-03T21:31:08Z",
        "intent": {}
      },
      "version": "1.0"
    };

    var openEvent = {
       "session": {
         "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
         "application": {
           "applicationId": "amzn1.ask.skill.4c848d38-347c-4e03-b908-42c6af6c207d"
         },
         "attributes": {},
         "user": {
           "userId": "amzn1.ask.account.AFLJ3RYNI3X6MQMX4KVH52CZKDSI6PMWCQWRBHSPJJPR2MKGDNJHW36XF2ET6I2BFUDRKH3SR2ACZ5VCRLXLGJFBTQGY4RNYZA763JED57USTK6F7IRYT6KR3XYO2ZTKK55OM6ID2WQXQKKXJCYMWXQ74YXREHVTQ3VUD5QHYBJTKHDDH5R4ALQAGIQKPFL52A3HQ377WNCCHYI"
         },
         "new": true
       },
       "request": {
         "type": "LaunchRequest",
         "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
         "locale": "en-US",
         "timestamp": "2016-11-03T21:31:08Z",
         "intent": {}
       },
       "version": "1.0"
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
    else if (argv[2] == "location")
    {
        lambda.request.intent = setLocation;
        setLocation.slots.Location.value = (argv.length > 3) ? argv[3] : "Seattle";
    }
    else if (argv[2] == "locationZIP")
    {
        lambda.request.intent = setLocationZIP;
        setLocationZIP.slots.LocationZIP.value = (argv.length > 3) ? argv[3] : "98112";
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

// Simple response - just print out what I'm given
function myResponse(appId) {
  this._appId = appId;
}

myResponse.succeed = function(result) {
  if (result.response.outputSpeech) {
    if (result.response.outputSpeech.ssml) {
      console.log('AS SSML: ' + result.response.outputSpeech.ssml);
    } else {
      console.log(result.response.outputSpeech.text);
    }
  }
  if (result.response.card && result.response.card.content) {
    console.log('Card Content: ' + result.response.card.content);
  }
  if (result.response.speechletResponse && result.response.speechletResponse.directives
    && result.response.speechletResponse.directives.videoItem) {
    console.log('Video ' + result.response.speechletResponse.directives.videoItem.source);
  }
  console.log('The session ' + ((!result.response.shouldEndSession) ? 'stays open.' : 'closes.'));
  if (result.sessionAttributes) {
    // Output the attributes too
    const fs = require('fs');
    fs.writeFile(attributeFile, JSON.stringify(result.sessionAttributes), (err) => {
      if (!process.env.NOLOG) {
        console.log('attributes:' + JSON.stringify(result.sessionAttributes) + ',');
      }
    });
  }
}

myResponse.fail = function(e) {
  console.log(e);
}

// Build the event object and call the app
if ((process.argv.length == 3) && (process.argv[2] == 'clear')) {
  const fs = require('fs');

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
      mainApp.handler(event, myResponse);
  }
}
