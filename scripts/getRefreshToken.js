const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = '478574382172-rsnnjm16nmq9oulsmgcrkh971c7uj3g6.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://localhost:3000'; // e.g., "http://localhost:5000/oauth2callback"

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://mail.google.com/'];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('Your refresh token is:', tokens.refresh_token);
  } catch (error) {
    console.error('Error retrieving access token', error);
  }
});