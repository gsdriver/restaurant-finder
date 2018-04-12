'use strict';

const AWS = require('aws-sdk');
AWS.config.update({
  region: 'us-east-1',
});
const doc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const results = [];

processDBEntries('RestaurantFinderUserData',
  (entry) => {
    const newEntry = {};

    newEntry.userId = entry.UserID;
    newEntry.attributes = {};
    newEntry.attributes.lastAction = entry.lastAction;
    newEntry.attributes.location = entry.location;
    if (entry.lastResponse) {
      const lastResponse = JSON.parse(entry.lastResponse);
      newEntry.attributes.lastResponse = {};
      newEntry.attributes.lastResponse.total = lastResponse.total;
      newEntry.attributes.lastResponse.read = lastResponse.read;

      if (lastResponse.restaurants) {
        newEntry.attributes.lastResponse.restaurants = [];
        lastResponse.restaurants.forEach((restaurant) => {
          const myResult = {};

          myResult.phone = restaurant.phone;
          myResult.name = restaurant.name;
          myResult.rating = restaurant.rating;
          myResult.review_count = restaurant.review_count;
          myResult.is_closed = restaurant.is_closed;
          myResult.price = restaurant.price;
          myResult.distance = restaurant.distance;
          myResult.url = restaurant.url;

          if (restaurant.location) {
            myResult.location = {};
            myResult.location.address1 =
              (restaurant.location.address1 && restaurant.location.address1.length)
              ? restaurant.location.address1 : undefined;
            myResult.location.city =
              (restaurant.location.city && restaurant.location.city.length)
              ? restaurant.location.city : undefined;
            myResult.location.display_address = restaurant.location.display_address;
          }

          newEntry.attributes.lastResponse.restaurants.push(myResult);
        });
      }
    }

    results.push(newEntry);
    writeEntry(newEntry);
  },
  (err, results) => {
  if (err) {
    callback('Error processing data: ' + err);
  } else {
    console.log('processed');
  }
});

function writeEntry(result) {
  // Write to the new DB
  const itemParams = {};
  itemParams.userId = result.userId;
  itemParams.mapAttr = result.attributes;
  doc.put({TableName: 'RestaurantFinder',
      Item: itemParams},
      (err, data) => {
    // We don't take a callback, but if there's an error log it
    if (err) {
      console.log(err);
    }
    complete();
  });

  function complete() {
    console.log('Done!');
  }
}

function processDBEntries(dbName, callback, complete) {
  const results = [];

  // Loop thru to read in all items from the DB
  (function loop(firstRun, startKey) {
   const params = {TableName: dbName};

   if (firstRun || startKey) {
     params.ExclusiveStartKey = startKey;

     const scanPromise = doc.scan(params).promise();
     return scanPromise.then((data) => {
       let i;

       for (i = 0; i < data.Items.length; i++) {
         const entry = callback(data.Items[i]);
         if (entry) {
           results.push(entry);
         }
       }

       if (data.LastEvaluatedKey) {
         return loop(false, data.LastEvaluatedKey);
       }
     });
   }
  })(true, null).then(() => {
    complete(null, results);
  }).catch((err) => {
    console.log(err.stack);
    complete(err);
  });
}
