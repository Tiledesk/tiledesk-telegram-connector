"use strict";
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const pjson = require('./package.json');

// tiledesk clients
const { TiledeskSubscriptionClient } = require('./tiledesk/TiledeskSubscriptionClient');
const { TiledeskTelegram } = require('./tiledesk/TiledeskTelegram');
const { TiledeskTelegramTranslator } = require('./tiledesk/TiledeskTelegramTranslator');
const { TiledeskChannel } = require('./tiledesk/TiledeskChannel');
const { TiledeskAppsClient } = require('./tiledesk/TiledeskAppsClient');

// mongo
const { KVBaseMongo } = require('@tiledesk/tiledesk-kvbasemongo');
const kvbase_collection = 'kvstore';

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(express.static(path.join(__dirname, 'template')));

var API_URL = null;
var TELEGRAM_API_URL = null;
var TELEGRAM_FILE_URL = null;
var BASE_URL = null;
var APPS_API_URL = null;
var log = false;

const db = new KVBaseMongo(kvbase_collection);

router.get('/', async (req, res) => {
  res.send('Home works!')
})

router.get('/detail', async (req, res) => {

  let projectId = req.query.project_id;
  let token = req.query.token;
  let app_id = req.query.app_id;

  const appClient = new TiledeskAppsClient({ APPS_API_URL: APPS_API_URL });
  let installation = await appClient.getInstallations(projectId, app_id);

  let installed = false;
  if (installation) {
    installed = true;
  }

  readHTMLFile('/detail.html', (err, html) => {
    if (err) {
      console.log("(ERROR) Read html file: ", err);
    }

    var template = handlebars.compile(html);
    var replacements = {
      app_version: pjson.version,
      project_id: projectId,
      token: token,
      app_id: app_id,
      installed: installed
    }
    if (log) {
      console.log("Replacements: ", replacements);
    }
    var html = template(replacements);
    res.send(html);
  })
})

router.get('/configure', async (req, res) => {
  console.log("\n/configure");
  if (log) {
    console.log("/configure query: ", req.query);
  }

  let projectId = "";
  let token = "";

  projectId = req.query.project_id;
  token = req.query.token;

  let CONTENT_KEY = "telegram-" + projectId;

  let settings = await db.get(CONTENT_KEY);
  console.log("[KVDB] settings: ", settings);

  if (settings) {
    var replacements = {
      app_version: pjson.version,
      project_id: projectId,
      token: token,
      bot_name: settings.bot_name,
      telegram_token: settings.telegram_token,
      subscriptionId: settings.subscriptionId,
      show_info_message: settings.show_info_message
    }
  } else {
    var replacements = {
      app_version: pjson.version,
      project_id: projectId,
      token: token,
    }
  }
  if (log) {
    console.log("Replacements: ", replacements);
  }

  readHTMLFile('/configure.html', (err, html) => {
    if (err) {
      console.log("(ERROR) Real html file: ", err);
    }

    var template = handlebars.compile(html);

    var html = template(replacements);
    res.send(html);
  })

})

router.post('/update', async (req, res) => {
  console.log("\n/update");
  if (log) {
    console.log("/update body: ", req.body);
  }

  let projectId = req.body.project_id;
  let token = req.body.token;
  let telegram_token = req.body.telegram_token;
  let bot_name = req.body.bot_name;

  let CONTENT_KEY = "telegram-" + projectId;
  let settings = await db.get(CONTENT_KEY);

  if (settings) {
    settings.bot_name = bot_name;
    settings.telegram_token = telegram_token;

    await db.set(CONTENT_KEY, settings);

    readHTMLFile('/configure.html', (err, html) => {
      if (err) {
        console.log("(ERROR) Read html file: ", err);
      }

      var template = handlebars.compile(html);
      var replacements = {
        app_version: pjson.version,
        project_id: settings.project_id,
        token: settings.token,
        subscriptionId: settings.subscriptionId,
        bot_name: settings.bot_name,
        telegram_token: settings.telegram_token,
        show_info_message: settings.show_info_message
      }
      if (log) {
        console.log("Replacements: ", replacements);
      }

      var html = template(replacements);
      res.send(html);
    })

  }
  else {
    // Add new settings on mongodb
    const tdClient = new TiledeskSubscriptionClient({ API_URL: API_URL, project_id: projectId, token: token, log: false })

    const subscription_info = {
      target: BASE_URL + "/tiledesk",
      event: 'message.create.request.channel.telegram'
    }

    tdClient.subscribe(subscription_info).then((data) => {
      let subscription = data;
      if (log) {
        console.log("\nSubscription: ", subscription)
      }

      // setWebhookEndpoint for Telegram
      const ttClient = new TiledeskTelegram({ BASE_URL: BASE_URL, TELEGRAM_API_URL: TELEGRAM_API_URL, log: true });

      ttClient.setWebhookEndpoint(projectId, telegram_token).then((response) => {
        console.log("Set webhook endpoint response: ", response.status, response.statusText);

        let settings = {
          app_version: pjson.version,
          project_id: projectId,
          token: token,
          subscriptionId: subscription._id,
          secret: subscription.secret,
          bot_name: bot_name,
          telegram_token: telegram_token,
          show_info_message: false
        }

        db.set(CONTENT_KEY, settings);

        readHTMLFile('/configure.html', (err, html) => {
          if (err) {
            console.log("(ERROR) Read html file: ", err);
          }

          var template = handlebars.compile(html);
          var replacements = {
            app_version: pjson.version,
            project_id: settings.project_id,
            token: settings.token,
            subscriptionId: settings.subscriptionId,
            bot_name: settings.bot_name,
            telegram_token: settings.telegram_token,
            show_info_message: settings.show_info_message
          }
          if (log) {
            console.log("Replacements: ", replacements);
          }

          var html = template(replacements);
          res.send(html);
        })

      }).catch((err) => {
        console.error("ERROR Set webhook endpoint: ", err);
      })

    }).catch((err) => {
      console.log("\n (ERROR) Subscription: ", err)
    })
  }
})

router.post('/update_advanced', async (req, res) => {
  console.log("\n/update");
  console.log("req.body: ", req.body);

  let projectId = req.body.project_id;
  let show_info_message = false;
  if (req.body.show_info_message && req.body.show_info_message == 'on') {
    show_info_message = true;
  }

  let CONTENT_KEY = "telegram-" + projectId;
  let settings = await db.get(CONTENT_KEY);

  if (settings) {
    settings.show_info_message = show_info_message;
    db.set(CONTENT_KEY, settings);
    await db.get(CONTENT_KEY);
  }
  res.status(200)
})

router.post('/disconnect', async (req, res) => {
  console.log("\n/disconnect")
  if (log) {
    console.log("/disconnect body: ", req.body)
  }

  let projectId = req.body.project_id;
  let token = req.body.token;
  let subscriptionId = req.body.subscriptionId;

  let CONTENT_KEY = "telegram-" + projectId;
  await db.remove(CONTENT_KEY);
  console.log("Content deleted.");

  const tdClient = new TiledeskSubscriptionClient({ API_URL: API_URL, project_id: projectId, token: token, log: false })

  tdClient.unsubscribe(subscriptionId).then((data) => {

    readHTMLFile('/configure.html', (err, html) => {

      if (err) {
        console.log("(ERROR) Read html file: ", err);
      }

      var template = handlebars.compile(html);
      var replacements = {
        app_version: pjson.version,
        project_id: projectId,
        token: token,
      }
      if (log) {
        console.log("Replacements: ", replacements);
      }

      var html = template(replacements);
      res.send(html);
    })
  }).catch((err) => {
    console.error("(ERROR) Unsubscribe: ", err);
  })

})

router.post('/tiledesk', async (req, res) => {
  console.log("\n/tiledesk")
  if (log) {
    //console.log("/tiledesk tiledeskChannelMessage: ", req.body.payload);
  }

  var tiledeskChannelMessage = req.body.payload;
  let projectId = tiledeskChannelMessage.id_project;

  let attributes = req.body.payload.attributes;
  let sender_id = tiledeskChannelMessage.sender;

  if (sender_id.indexOf("telegram") > -1) {
    console.log("Skip same sender");
    return res.send(200);
  }

  //get settings from mongo
  if (attributes && attributes.subtype === "info") {
    console.log("Skip subtype: ", attributes.subtype);
    return res.send(200);
  }

  let CONTENT_KEY = "telegram-" + projectId;
  let settings = await db.get(CONTENT_KEY);

  if (attributes && attributes.subtype === 'info/support') {
    //console.log("subtype: ", attributes.subtype);
    //console.log("show info message: ", settings.show_info_message);

    // Temporary solve the bug of multiple lead update messages
    if (attributes.messagelabel.key == 'LEAD_UPDATED') {
      console.log("Skip LEAD_UPDATED");
      return res.send(200);
    }

    if (!settings.show_info_message || settings.show_info_message == false) {
      console.log("show info message: ", settings.show_info_message);
      console.log("Skip subtype: ", attributes.subtype);
      return res.send(200);
    }
  }

  let recipient_id = tiledeskChannelMessage.recipient;

  let chat_id = recipient_id.substring(recipient_id.lastIndexOf("-") + 1);
  console.log("Chat id: ", chat_id);

  const tlr = new TiledeskTelegramTranslator();

  const telegramJsonMessage = await tlr.toTelegram(tiledeskChannelMessage, chat_id);
  console.log("telegramJsonMessage: ", telegramJsonMessage);

  if (telegramJsonMessage) {

    const ttClient = new TiledeskTelegram({ BASE_URL: BASE_URL, TELEGRAM_API_URL: TELEGRAM_API_URL, log: true });

    if (telegramJsonMessage.photo) {
      ttClient.sendPhoto(settings.telegram_token, telegramJsonMessage)
    }
    else if (telegramJsonMessage.video) {
      ttClient.sendVideo(settings.telegram_token, telegramJsonMessage)
    }
    else if (telegramJsonMessage.document) {
      ttClient.sendDocument(settings.telegram_token, telegramJsonMessage)
    }
    else {
      ttClient.sendMessage(settings.telegram_token, telegramJsonMessage)
    }

  } else {
    console.log("ERROR Send message - Telegram json message not defined ", err);
  }

})

router.post('/telegram', async (req, res) => {
  console.log("\n/telegram");
  console.log("req.body: ", req.body);
  let projectId = req.query.project_id;

  if (!req.body.message && !req.body.callback_query) {
    console.log("Message or callback query undefined");
    return res.send({ message: "Message not sent" });
  }

  if (req.body.edited_message) {
    console.log("Edited message catched");
    return res.send({ message: "Edited messages are not supported. Message ignored." })
  }

  let telegramChannelMessage = req.body;
  console.log("telegramChannelMessage: ", telegramChannelMessage);

  let CONTENT_KEY = "telegram-" + projectId;

  let settings = await db.get(CONTENT_KEY);
  if (log) {
    console.log("[KVDB] settings: ", settings);
  }

  if (!settings) {
    console.log("No settings found. Exit..");
    return res.send({ message: "Telegram not installed for this project" });
  }

  const ttClient = new TiledeskTelegram({ BASE_URL: BASE_URL, TELEGRAM_API_URL: TELEGRAM_API_URL, log: true });

  if (telegramChannelMessage.callback_query) {
    // Clear inline buttons
    let reply_markup_data = {
      chat_id: telegramChannelMessage.callback_query.message.chat.id,
      message_id: telegramChannelMessage.callback_query.message.message_id,
      reply_markup: {
        inline_keyboard: []
      }
    }

    let response = ttClient.editMessageReplyMarkup(settings.telegram_token, reply_markup_data);
    console.log("Edit message markup response: ", response.data);
  }

  const tlr = new TiledeskTelegramTranslator();
  let tiledeskJsonMessage;

  if (telegramChannelMessage.message) {

    // Photo
    if (telegramChannelMessage.message.photo) {
      let index = telegramChannelMessage.message.photo.length - 1;
      const file = await ttClient.downloadMedia(settings.telegram_token, telegramChannelMessage.message.photo[index].file_id);
      console.log("\n\nfile.result.file_path: ", file.result.file_path);
      tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage, settings.telegram_token, file.result.file_path);
    }

    // Video
    else if (telegramChannelMessage.message.video) {
      const file = await ttClient.downloadMedia(settings.telegram_token, telegramChannelMessage.message.video.file_id);
      console.log("\n\nfile.result.file_path: ", file.result.file_path);
      tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage, settings.telegram_token, file.result.file_path);
    }

    // File or Document
    else if (telegramChannelMessage.message.document) {
      const file = await ttClient.downloadMedia(settings.telegram_token, telegramChannelMessage.message.document.file_id);
      console.log("\n\nfile.result.file_path: ", file.result.file_path);
      tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage, settings.telegram_token, file.result.file_path);
    }

    // Text Message
    else {
      tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage);
    }

  } else {
    tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage);
  }

  console.log("tiledeskJsonMessage: ", tiledeskJsonMessage);

  if (tiledeskJsonMessage) {

    let message;
    if (telegramChannelMessage.message) {
      message = telegramChannelMessage.message;
    } else {
      message = telegramChannelMessage.callback_query;
    }

    let message_info = {
      channel: "telegram",
      telegram: {
        from: message.from.id,
        firstname: message.from.first_name,
        lastname: message.from.last_name
      }
    };

    const tdChannel = new TiledeskChannel({ settings: settings, API_URL: API_URL });
    const response = await tdChannel.send(tiledeskJsonMessage, message_info);

    console.log("Message sent!")
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }

})

router.post('/telegram_old', async (req, res) => {

  console.log("\n/telegram")
  if (log) {
    console.log("/telegram telegramChannelMessage: ", req.body);
  }

  let projectId = req.query.project_id;
  let telegramChannelMessage = req.body;

  if (telegramChannelMessage.edited_message) {
    console.log("Edited message catched");
    return res.send({ message: "Edited messages are not supported. Message ignored." })
  }

  if (!telegramChannelMessage.message && !telegramChannelMessage.callback_query) {
    console.log("Message or callback query undefined");
    res.send({ message: "Message not sent" });
  }

  else {

    let CONTENT_KEY = "telegram-" + projectId;

    let settings = await db.get(CONTENT_KEY);
    if (log) {
      console.log("[KVDB] settings: ", settings);
    }

    if (!settings) {
      console.log("No settings found. Exit..");
      res.send({ message: "Telegram not installed for this project" });
      return;
    }

    const ttClient = new TiledeskTelegram({ BASE_URL: BASE_URL, TELEGRAM_API_URL: TELEGRAM_API_URL, log: true });

    if (telegramChannelMessage.callback_query) {
      // Clear inline buttons
      let reply_markup_data = {
        chat_id: telegramChannelMessage.callback_query.message.chat.id,
        message_id: telegramChannelMessage.callback_query.message.message_id,
        reply_markup: {
          inline_keyboard: []
        }
      }

      let response = ttClient.editMessageReplyMarkup(settings.telegram_token, reply_markup_data);
      console.log("Edit message markup response: ", response);
    }

    const tlr = new TiledeskTelegramTranslator();

    let tiledeskJsonMessage;

    // Message
    if (telegramChannelMessage.message) {

      // Photo
      if (telegramChannelMessage.message.photo) {
        let index = telegramChannelMessage.message.photo.length - 1;
        const file = await ttClient.downloadMedia(settings.telegram_token, telegramChannelMessage.message.photo[index].file_id);
        tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage, settings.telegram_token, file.result.file_path);
      }

      // Video
      else if (telegramChannelMessage.message.video) {
        const file = await ttClient.downloadMedia(settings.telegram_token, telegramChannelMessage.message.video.file_id);
        tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage, settings.telegram_token, file.result.file_path);
      }

      // File or Document
      else if (telegramChannelMessage.message.document) {
        const file = await ttClient.downloadMedia(settings.telegram_token, telegramChannelMessage.message.document.file_id);
        tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage, settings.telegram_token, file.result.file_path);
      }

      // Text Message
      else {
        tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage);
      }

    }
    // Interactive message
    else {
      tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage);
    }

    console.log("tiledeskJsonMessage: ", tiledeskJsonMessage);

    if (tiledeskJsonMessage) {
      let message_info = {
        channel: "telegram",
        telegram: {
          from: telegramChannelMessage.message.from.id,
          firstname: telegramChannelMessage.message.from.first_name,
          lastname: telegramChannelMessage.message.from.last_name
        }
      };

      const tdChannel = new TiledeskChannel({ settings: settings, API_URL: API_URL });
      const response = await tdChannel.send(tiledeskJsonMessage, message_info);

      console.log("Message sent!")
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  }
})


// *****************************
// ********* FUNCTIONS *********
// *****************************

function startApp(settings, callback) {
  console.log("Starting Telegram App: ");

  if (!settings.MONGODB_URL) {
    throw new Error("settings.MONGODB_URL is mandatory")
  }

  if (!settings.API_URL) {
    throw new Error("settings.API_URL is mandatory");
  } else {
    API_URL = settings.API_URL;
    console.log("API_URL: ", API_URL);
  }

  if (!settings.BASE_URL) {
    throw new Error("settings.BASE_URL is mandatory");
  } else {
    BASE_URL = settings.BASE_URL;
    console.log("BASE_URL: ", BASE_URL);
  }

  if (!settings.TELEGRAM_API_URL) {
    throw new Error("settings.TELEGRAM_API_URL is mandatory");
  } else {
    TELEGRAM_API_URL = settings.TELEGRAM_API_URL;
    console.log("TELEGRAM_API_URL: ", TELEGRAM_API_URL);
  }

  if (!settings.TELEGRAM_FILE_URL) {
    throw new Error("settings.TELEGRAM_API_URL is mandatory");
  } else {
    TELEGRAM_FILE_URL = settings.TELEGRAM_FILE_URL;
    console.log("TELEGRAM_FILE_URL: ", TELEGRAM_FILE_URL);
  }

  if (!settings.APPS_API_URL) {
    throw new Error("settings.APPS_API_URL is mandatory");
  } else {
    APPS_API_URL = settings.APPS_API_URL;
    console.log("APPS_API_URL: ", APPS_API_URL);
  }

  if (settings.log) {
    log = settings.log;
  }

  db.connect(settings.MONGODB_URL, () => {
    console.log("KVBaseMongo succesfully connected.");
    if (callback) {
      callback();
    }
  })
}

function readHTMLFile(templateName, callback) {
  console.log("Reading file: ", templateName)
  fs.readFile(__dirname + '/template' + templateName, { encoding: 'utf-8' },
    function(err, html) {
      if (err) {
        throw err;
        //callback(err);
      } else {
        callback(null, html)
      }
    })
}

module.exports = { router: router, startApp: startApp };