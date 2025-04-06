
const { google } = require('googleapis');
const readline = require('readline');

// Fill in your client info here:
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// These are the scopes required to send emails via Gmail
const SCOPES = ['https://mail.google.com/'];

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// 1. Generate a URL for the user’s consent
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});
console.log('Authorize this app by visiting this url:', authUrl);

// 2. After visiting the URL, Google will redirect to localhost:3000 with a `code` param
//    Copy that code, and paste below:
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  rl.close();
  const { tokens } = await oAuth2Client.getToken(code);
  console.log('Tokens acquired: ', tokens);
  // tokens.refresh_token is what you need for your environment variables
});
