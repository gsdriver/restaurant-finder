/*
 * Handles DynamoDB storage
 */

var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});

var storage = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    /*
     * The UserData class stores all game states for the user
     */
    function UserData(session, location, lastRequestParams, lastResponse) {
        // Save values or defaults
        this.location = (location) ? location : "";
        this.lastRequestParams = (lastRequestParams) ? lastRequestParams : {};
        this.lastResponse = (lastResponse) ? lastResponse : {total: 0, read: 0, restaurants: []};

        // Save the session information
        this._session = session;
    }

    UserData.prototype = {
        save: function (callback) {
            // Save state in the session object, so we can reference that instead of hitting the DB
            this._session.attributes.userData = this.data;
            dynamodb.putItem({
                TableName: 'RestaurantFinderUserData',
                Item: { UserID: {S: this._session.user.userId },
                        location: {S: this.location},
                        lastRequestParams: {S: JSON.stringify(this.lastRequestParams)},
                        lastResponse: {S: JSON.stringify(this.lastResponse)}}
            }, function (err, data) {
                // We only need to pass the error back - no other data to return
                if (err)
                {
                    console.log(err, err.stack);
                }
                if (callback)
                {
                    callback(err);
                }
            });
        }
    };

    return {
        loadUserData: function (session, callback) {
            if (session.attributes.userData)
            {
                // It was in the session so no need to hit the DB
                callback(new UserData(session, session.attributes.userData.location,
                                    session.attributes.userData.lastRequestParams,
                                    session.attributes.userData.lastResponse));
            }
            else
            {
                dynamodb.getItem({TableName: 'RestaurantFinderUserData',
                                  Key: { UserID: {S: session.user.userId}}}, function (error, data) {
                    var userData;

                    if (error || (data.Item == undefined))
                    {
                        // No big deal, we'll just start over
                        userData = new UserData(session);
                        session.attributes.userData = userData.data;
                        callback(userData);
                    }
                    else
                    {
                        userData = new UserData(session, data.Item.location.S,
                                            JSON.parse(data.Item.lastRequestParams.S),
                                            JSON.parse(data.Item.lastResponse.S));
                        session.attributes.userData = userData.data;
                        callback(userData);
                    }
                });
            }
        },
        newUserData: function (session) {
            return new newUserData(session);
        }
    };
})();

module.exports = storage;
