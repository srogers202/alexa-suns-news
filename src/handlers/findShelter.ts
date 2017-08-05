import {unwindObject, Shelter} from '../utility/petFinder.service';

const get = require('lodash/get');
const rp = require('request-promise-native');

export default function findShelterHandler(request, response) {
  console.log('findShelterHandler');

  const postalCode = get(request, 'location.postalCode');

  const limit = get(request, 'route.query.limit') || 5;
  const offset = get(request, 'route.query.offset') || 0;
  const options = {
    json: true,
    qs: {
      count: limit,
      format: 'json',
      location: postalCode,
      offset: offset,
      output: 'full',
      key: process.env.API_KEY
    },
    uri: 'http://api.petfinder.com/shelter.find',
  };

  return rp(options)
    .then(mapShelterResponse)
    .then(function (shelters: Shelter[]) {
      if (!get(shelters, 'length')) throw new Error('No shelters found');

      let text = `<p>I found ${shelters.length} shelters near you</p>`;

      const spokenShelters = shelters.map(shelter => {
        let shelterText = shelter.name;

        shelterText += (shelter.address1 || shelter.address2) ? ` at <say-as interpret-as="address">${shelter.address1 || ''} ${shelter.address2 || ''}</say-as>` : '';
        shelterText += shelter.city ? ` in ${shelter.city || ''} ${shelter.state || ''}.` : '';
        shelterText += shelter.phone ? ` </p>Phone: <say-as interpret-as="telephone">${shelter.phone}</say-as><p>` : '';
        shelterText += shelter.email ? ` </p>Email: ${shelter.email}<p>` : '';

        return `<p>${shelterText}</p>`;
      });
      text += spokenShelters.join('');

      const cardShelters = shelters.map(shelter => {
        let lines = [shelter.name];

        lines = lines.concat(shelter.address1 || []);
        lines = lines.concat(shelter.address2 || []);
        lines = lines.concat(shelter.city ? `${shelter.city} ${shelter.state || ''}` : []);
        lines = lines.concat(shelter.phone || []);
        lines = lines.concat(shelter.email || []);

        return lines.join('\n');
      });
      const card = {
        type: 'Simple',
        title: `Local shelters near ${postalCode}`,
        content: cardShelters.join('\n---\n'),
      };
      text += `<p>I've sent this list to your Alexa app.</p>`;

      if (shelters.length === limit) {
        const nextRoute = `/shelters?limit=${limit}&offset=${offset + limit}`;
        response.route({
          'AMAZON.CancelIntent': '/exit',
          'AMAZON.NextIntent': nextRoute,
          'AMAZON.NoIntent': '/exit',
          'AMAZON.YesIntent': nextRoute,
          FindShelterIntent: nextRoute,
        });
        text += `<p>Would you like to hear more?</p>`
      }

      console.log('Card: ' + JSON.stringify(card));
      console.log('Text: ' + JSON.stringify(text));
      return response.card(card).say(text).send();
    })
    .catch(function (err) {
      console.log('Error in findShelter: ' + err);

      return response.say(`I wasn't able to find any shelters near you.`).send();
    });
}

function mapShelterResponse(response: any): Shelter[] {
  console.log('Shelter response: ' + JSON.stringify(response));
  const shelters = [].concat(get(response, 'petfinder.shelters.shelter', []));

  return shelters.map(unwindObject);
}
