(function () {
  let lambda = require('../src/index.ts');
  let fs = require('fs');

  let intent = process.argv[2];

  let event = {
    "session": {
      "sessionId": "SessionId.11111111-2222-3333-4444-555555555555",
      "application": {
        "applicationId": "amzn1.echo-sdk-ams.app.11111111-2222-3333-4444-555555555555"
      },
      "attributes": {},
      "new": true
    },
    "request": {
      "type": "IntentRequest",
      "requestId": "EdwRequestId.75591a21-9e75-423b-a3e6-0cb21ba680eb",
      "locale": "en-US",
      "timestamp": "2016-10-06T22:18:18Z",
      "intent": {
        "name": intent,
        "slots": {
          "number": {
            "name": "number"
          }
        }
      }
    },
    "version": "1.0"
  };

  let context = {
    name: 'context',
    fail: function () {
      console.log('Failed context');
    },
    succeed: function (result) {
      console.log('Succeeded context');
    }
  };

  lambda.handler(event, context);
})();
