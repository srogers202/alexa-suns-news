import {camelCaseToSpaces, unwindArray, unwindObject, unwindPhotos, Pet} from '../utility/petFinder.service';
import {validateText} from '../utility/tools';

const get = require('lodash/get');
const rp = require('request-promise-native');

import {AnimalsFuzzy} from '../types';

export default function findPetHandler(request, response) {
  console.log('findPetHandler');

  // HTTP to HTTPS for image resources.  Currently using the first one.

  //https://images.weserv.nl/
  //https://images.weserv.nl/?url=photos.petfinder.com/photos/pets/36879038/1/?bust=1480720144&width=500&-x.jpg

  //https://developer.hootsuite.com/v1.0/docs/https-image-proxy
  //https://d1r1anxoiubeog.cloudfront.net/http%3A%2F%2Fwww.example.com%2Fmyimage%3Fimage%3D%22abcd%22

  const postalCode = get(request, 'location.postalCode');

  const animalQuery = request.slot('ANIMAL_TYPE') || get(request, 'route.query.animal');
  console.log('Raw animal type: ' + animalQuery);
  const animal = AnimalsFuzzy[(animalQuery || '').toLowerCase()];

  const offset = get(request, 'route.query.offset') || 0;
  const options: any = {
    json: true,
    qs: {
      count: 1,
      format: 'json',
      location: postalCode,
      offset: offset,
      output: 'full',
      key: process.env.API_KEY
    },
    uri: 'http://api.petfinder.com/pet.find',
  };
  if (animal) options.qs.animal = animal;

  return rp(options)
    .then(mapPetResponse)
    .then(function (pets: Pet[]) {
      if (!get(pets, 'length')) throw new Error('No pets found');

      const pet = pets[0];

      const genders = {
        F: 'Female',
        M: 'Male',
      };

      const sizes = {
        S: 'Small',
        M: 'Medium',
        L: 'Large',
        XL: 'Extra Large',
      };

      let text = `<p>${pet.name || 'This animal'} is a `;
      text += `${sizes[pet.size] || ''} `;
      text += `${pet.age || ''} `;
      text += `${genders[pet.sex] || ''} `;
      text += ` ${pet.animal || ''}</p>`;
      text += `<p>${speakBreed(pet.breeds)}</p>`;
      text += `<p>${pet.description || ''}</p>`;

      let cardContent = `Name: ${pet.name}\n`;
      cardContent += sizes[pet.size] ? `${sizes[pet.size]} ` : '';
      cardContent += genders[pet.sex] ? `${genders[pet.sex]} ` : '';
      cardContent += `${pet.animal}\n`;
      cardContent += pet.age ? `Age: ${pet.age}\n` : '';
      cardContent += pet.breeds.length ? `Breeds: ${pet.breeds.join(', ')}\n` : '';
      cardContent += pet.options.length ? `Notes: ${pet.options.join(', ')}\n` : '';
      cardContent += `---\n`;
      cardContent += `Contact:\n`;
      cardContent += pet.contact.address1 ? `${pet.contact.address1}\n` : '';
      cardContent += pet.contact.address2 ? `${pet.contact.address2}\n` : '';
      cardContent += `${pet.contact.city || ''}, ${pet.contact.state || ''} ${pet.contact.zip || ''}\n`;
      cardContent += pet.contact.phone ? `${pet.contact.phone}\n` : '';
      cardContent += pet.contact.email ? `${pet.contact.email}\n` : '';

      let card;
      if (pet.photos.length) {
        const sortedPhotos = pet.photos.sort((a, b) => (a.size > b.size  || a.id < b.id) ? -1 : 1);
        const photoUrl = 'https://images.weserv.nl/?url=' + sortedPhotos[0].url.replace('http://', '');

        card = {
          type: 'Standard',
          title: pet.name,
          text: cardContent,
          image: {
            smallImageUrl: photoUrl,
            largeImageUrl: photoUrl,
          }
        };
        text += `<p>I've sent a photo and more details to your Alexa app.</p>`;
      } else {
        card = {
          type: 'Simple',
          title: pet.name,
          content: cardContent,
        };
        text += `<p>I've sent more details to your Alexa app.</p>`;
      }

      const animalParam = animalQuery ? `&animal=${animalQuery}` : '';
      const nextRoute = `/pets?offset=${offset + 1}${animalParam}`;
      response.route({
        'AMAZON.CancelIntent': '/exit',
        'AMAZON.NextIntent': nextRoute,
        'AMAZON.NoIntent': '/exit',
        'AMAZON.YesIntent': nextRoute,
        FindShelterIntent: nextRoute,
      });
      text += `<p>Would you like to hear another?</p>`

      console.log('Card: ' + JSON.stringify(card));
      console.log('Text: ' + JSON.stringify(text));
      return response.card(card).say(text).send();
    })
    .catch(function (err) {
      console.log('Error in findPets: ' + err);

      return response.say(`I wasn't able to find any more <phoneme alphabet="ipa" ph="pɛts">pets</phoneme> near you.`).send();
    });
}

function mapPetResponse(response: any): Pet[] {
  console.log('Pet response: ' + JSON.stringify(response));
  const pets = [].concat(get(response, 'petfinder.pets.pet', []));

  return pets.map(pet => {
    const result: Pet = {
      ...unwindObject(pet),
      options: unwindArray(get(pet, 'options.option')).map(camelCaseToSpaces).map(validateText),
      contact: unwindObject(get(pet, 'contact')),
      breeds: unwindArray(get(pet, 'breeds.breed')).map(validateText),
      photos: unwindPhotos(get(pet, 'media.photos.photo'))
    };

    result.animal = validateText((result.animal || '').replace('Small & Furry', 'Animal'));
    result.name = validateText(result.name);
    result.description = validateText(result.description);

    return result;
  });
}

function speakBreed(arr) {
  if (!arr) return '';

  if (arr.length === 1) return arr[0];

  return `${arr.slice(0, -1).join(', ')} and ${arr.slice(-1)[0]} mix`;
}
