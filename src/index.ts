declare let exports: any;
import * as alexa from 'alexa-app';
import * as router from 'alexa-app-router';

const get = require('lodash/get');
const rp = require('request-promise-native');

import findPetHandler from './handlers/findPet';
import findShelterHandler from './handlers/findShelter';

import {Animals} from './types';

(function () {
  const app = new alexa.app('alexa-adopt-a-pet');

  const config = {
    defaultRoutes: {
      'AMAZON.CancelIntent': '/exit',
      'AMAZON.HelpIntent': '/menu',
      'AMAZON.NextIntent': '/',
      'AMAZON.NoIntent': '/exit',
      'AMAZON.PreviousIntent': '/',
      'AMAZON.RepeatIntent': '/',
      'AMAZON.ResumeIntent': '/',
      'AMAZON.StartOverIntent': '/',
      'AMAZON.StopIntent': '/exit',
      'AMAZON.YesIntent': '/',
      FindPetIntent: '/pets?offset=0',
      FindShelterIntent: '/shelters?limit=5',
      MenuIntent: '/menu',
    },
    pre: preHandler,
    launch: launchHandler
  };

  const intents = {
    FindPetIntent: {
      slots: {ANIMAL_TYPE: 'ANIMAL_TYPE'},
      utterances: [
        '{for a |}{pet|pets|animal|animals}{| to adopt| to rescue}',
        'for {a|an} {-|ANIMAL_TYPE}{| to adopt| to rescue}',
        '{adopt a |find a }{-|ANIMAL_TYPE}'
      ]
    },
    FindShelterIntent: {utterances: ['{for a |for an |}{shelter|shelters|rescue}{| near me| around me}']},
    MenuIntent: {utterances: ['{menu|help}']},
  };

  const routes = {
    '/': launchHandler,
    '/exit': exitHandler,
    '/menu': menuHandler,
    '/pets': findPetHandler,
    '/shelters': findShelterHandler,
  };

  router.addRouter(app, config, intents, routes);

  app.messages.NO_INTENT_FOUND = 'Sorry, I didn\'t understand that.';
  app.messages.NO_LAUNCH_FUNCTION = 'Please ask me to do something!';
  app.messages.INVALID_REQUEST_TYPE = 'Sorry, I didn\'t understand that';
  app.messages.GENERIC_ERROR = 'Sorry, something went wrong. Please try saying something else.';

  // Connect to lambda
  exports.handler = app.handler;
  exports.alexa = app;

  // Validate request
  // If initialization fails and returns false, caller should return true
  // to avoid running async executions.
  function preHandler(request, response) {
    console.log('preHandler');
    const consentToken = get(request, 'context.System.user.permissions.consentToken');

    if (!consentToken) {
      console.log('No consent token found.');
      requestLocationPermission(request, response);

      return false;
    }

    return getLocation(request, response);
  }

  function getLocation(request, response) {
    console.log('Getting location.');
    const consentToken = get(request, 'context.System.user.permissions.consentToken');
    const deviceId = get(request, 'context.System.device.deviceId');

    const options = {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${consentToken}`
      },
      json: true,
      uri: `https://api.amazonalexa.com/v1/devices/${deviceId}/settings/address/countryAndPostalCode`,
    };

    return rp(options)
      .then((res: AlexaLocation) => {
        const postalCode = get(res, 'postalCode');

        if (postalCode) {
          console.log('Saving location to request object.');
          request.location = res;
        } else {
          requestLocationPermission(request, response);

          throw new Error('Need location permission.');
        }
      });
  }

  function requestLocationPermission(request, response) {
    response.say('The Adopt a Pet skill requires your location so I can find animals and shelters near you.  Please check your Alexa app to enable your location.');
    response.card({
      permissions: ['read::alexa:device:all:address:country_and_postal_code'],
      type: 'AskForPermissionsConsent',
    });
    response.send();
  }

  function launchHandler(request, response) {
    console.log('launchHandler');
    let text = '';

    text += `Welcome to the Adopt a Pet Alexa skill. Ask for a pet or a shelter. For types of <phoneme alphabet="ipa" ph="pɛts">pets</phoneme> you can adopt, say help.`;

    response
      .say(text)
      .route('/')
      .send();
  }

  function menuHandler(request, response) {
    const text = [
      'You can ask for <phoneme alphabet="ipa" ph="pɛts">pets</phoneme>, shelters, or a type of pet to adopt including',
    ]
      .concat(Object.keys(Animals).join(', '))
      .concat('What would you like?')
      .map(x => `<p>${x}</p>`)
      .join('');

    response
      .say(text)
      .route('/')
      .send();
  }

  function exitHandler(request, response) {
    console.log('exitHandler');
    const text = 'Thanks for adopting a little one!';
    response
      .say(text)
      .send();
  }
})();

export interface AlexaLocation {
  countryCode: string;
  postalCode: string;
}
