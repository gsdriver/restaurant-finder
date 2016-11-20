var mainApp = require('../src/index');

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
    var backIntent = {"name": "BackIntent", "slots": {}};
    var restaurantDetails = {"name": "DetailsIntent", "slots": {"RestaurantID": {"name": "RestaurantID", "value": ""}}};
    var repeatIntent = {"name": "AMAZON.RepeatIntent", "slots": {}};

    var lambda = {
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

    return lambda;
}

// Simple response - just print out what I'm given
function myResponse(appId) {
    this._appId = appId;
}

myResponse.succeed = function(result) {
    console.log(result.response.outputSpeech.text);
    console.log("The session " + ((!result.response.shouldEndSession) ? "stays open." : "closes."));
}

myResponse.fail = function(e) {
    console.log(e);
}

// Build the event object and call the app
var event = BuildEvent(process.argv);
if (event) {
    mainApp.handler(event, myResponse);
}