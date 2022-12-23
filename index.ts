import * as ftp from 'basic-ftp';
import dotenv from 'dotenv';
import https from 'https';

const MINUTE = 1000 * 60;
const THREE_MINUTES = MINUTE * 3;

dotenv.config();
const isDevMode = process.env.IS_DEV === 'true';
const REMOTE_URL = process.env.REMOTE_URL as string;
const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const BASE_TELEGRAM_URL = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHAT_ID}&parse_mode=html&`;
const PING_PROTOCOL: 'HTTPS' | 'FTP' = process.env.PING_PROTOCOL as
  | 'HTTPS'
  | 'FTP';
let isEnabled: boolean | null = null;

const sendMessage = (message: string): void => {
  isDevMode
    ? console.log(message)
    : https.get(`${BASE_TELEGRAM_URL}text=<b>${message}</b>`);
};

const checkFTP = async () => {
  const client = new ftp.Client();
  try {
    const response = await client.connect(REMOTE_URL, 21);
    if (response.code === 220 && isEnabled !== null && !isEnabled) {
      sendMessage(`Світло з'явилося 🌕`);
    }
    isEnabled = true;
  } catch (err) {
    if (isEnabled) {
      sendMessage('Світло пропало 🌑');
    }
    isEnabled = false;
  }
  client.close();
  setTimeout(checkFTP, isEnabled ? THREE_MINUTES : MINUTE);
};

const checHTTP = async () => {
  https
    .get(REMOTE_URL, (res) => {
      const { statusCode } = res;
      if (statusCode && isEnabled !== null && !isEnabled) {
        sendMessage(`Світло з'явилося 🌕`);
      }
      isEnabled = true;
    })
    .on('error', (e) => {
      if (isEnabled) {
        sendMessage('Світло пропало 🌑');
      }
      isEnabled = false;
    });

  setTimeout(checHTTP, isEnabled ? THREE_MINUTES : MINUTE);
};

switch (PING_PROTOCOL) {
  case 'HTTPS':
    checHTTP();
    break;
  case 'FTP':
    checkFTP();
    break;
}
