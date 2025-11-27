const https = require('https');

const API_KEY = 'AIzaSyA7KEkQhZQrh-qDJOwZuQi7R_UMHxGVWzg'; // Using the key from the file

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${API_KEY}`,
  method: 'GET',
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        console.log('Available models:');
        json.models.forEach(model => {
            if(model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                console.log(`- ${model.name}`);
            }
        });
      } else {
        console.log('Error:', json);
      }
    } catch (e) {
      console.error('Error parsing JSON:', e);
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();
