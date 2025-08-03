require('dotenv').config({path: '.env.local'});
const fetch = require('node-fetch');

async function testShotstack() {
  const edit = {
    timeline: {
      background: '#000000',
      tracks: [
        {
          clips: [
            {
              asset: {
                type: 'map',
                lat: 48.8588897,
                lon: 2.3200410217200766,
                zoom: 12,
                style: 'light-v11',
              },
              start: 0,
              length: 5,
            },
          ],
        },
      ],
    },
    output: {
      format: 'mp4',
      resolution: 'sd',
    },
  };

  const response = await fetch('https://api.shotstack.io/edit/v1/render', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.SHOTSTACK_API_KEY,
    },
    body: JSON.stringify(edit),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      'Shotstack API Error:',
      JSON.stringify(data.response.error.details, null, 2),
    );
    return;
  }

  console.log('Shotstack API Success:', data);
}

testShotstack();
