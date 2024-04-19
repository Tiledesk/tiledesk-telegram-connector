require('dotenv').config();
const express = require('express');
const app = express();

//const telegram = require('@tiledesk/tiledesk-telegram-connector');
const telegram = require('./telegramRoute');
const telegramRoute = telegram.router;

app.use('/', telegramRoute);

const BASE_URL = process.env.BASE_URL;
const API_URL = process.env.API_URL;
const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL;
const TELEGRAM_FILE_URL = process.env.TELEGRAM_FILE_URL;
const MONGODB_URL = process.env.MONGODB_URL;
const APPS_API_URL = process.env.APPS_API_URL;
const BRAND_NAME = process.env.BRAND_NAME;
const log = false;

console.log("Starting telegram");

telegram.startApp(
  {
    MONGODB_URL: MONGODB_URL,
    API_URL: API_URL,
    TELEGRAM_API_URL: TELEGRAM_API_URL,
    TELEGRAM_FILE_URL: TELEGRAM_FILE_URL,
    BASE_URL: BASE_URL,
    APPS_API_URL: APPS_API_URL,
    BRAND_NAME: BRAND_NAME,
    log: log
  }, () => {
    console.log("Telegram route succesfully started.");
    var port = process.env.PORT || 3000;
    app.listen(port, function() {
      console.log("Telegram connector listening on port: ", port);
    })
  }
)

/**
 * Alternative start passing ad external db client
 */
// mongoose.connect(MONGODB_URL, { useNewUrlParser: true, autoIndex: true }, function(err) {
//   if (err) {
//     console.error('Failed to connect to MongoDB on ' + databaseUri + " ", err);
//     process.exit(1);
//   }
//   console.log("Mongoose connection done on host: "+mongoose.connection.host + " on port: " + mongoose.connection.port + " with name: "+ mongoose.connection.name)// , mongoose.connection.db);

//   whatsapp.startApp(
//     {
//       dbconnection: mongoose.connection,
//       // like before
//     }
//   );
// });