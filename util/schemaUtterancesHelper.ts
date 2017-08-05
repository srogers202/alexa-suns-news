(function () {
  const fs = require('fs');
  const lambda = require('../src/index.ts');

  if (!fs.existsSync('./utilOutput')) {
    fs.mkdirSync('./utilOutput');
  }
  fs.writeFile('./utilOutput/schema.json', lambda.alexa.schema());
  fs.writeFile('./utilOutput/utterances.txt', lambda.alexa.utterances());
})();
