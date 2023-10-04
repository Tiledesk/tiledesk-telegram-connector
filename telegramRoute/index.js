"use strict";
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const pjson = require('./package.json');
const winston = require('./winston');

// tiledesk clients
const { TiledeskSubscriptionClient } = require('./tiledesk/TiledeskSubscriptionClient');
const { TiledeskTelegram } = require('./tiledesk/TiledeskTelegram');
const { TiledeskTelegramTranslator } = require('./tiledesk/TiledeskTelegramTranslator');
const { TiledeskChannel } = require('./tiledesk/TiledeskChannel');
const { TiledeskAppsClient } = require('./tiledesk/TiledeskAppsClient');
const { MessageHandler } = require('./tiledesk/MessageHandler');

// mongo
const { KVBaseMongo } = require('./tiledesk/KVBaseMongo');
const kvbase_collection = 'kvstore';
const db = new KVBaseMongo({ KVBASE_COLLECTION: kvbase_collection, log: false });

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(express.static(path.join(__dirname, 'template')));

var API_URL = null;
var TELEGRAM_API_URL = null;
var TELEGRAM_FILE_URL = null;
var BASE_URL = null;
var APPS_API_URL = null;
var log = false;

// Handlebars register helpers
handlebars.registerHelper('isEqual', (a, b) => {
  if (a == b) {
    return true
  } else {
    return false
  }
})

router.get('/', async (req, res) => {
  res.send('Welcome on Tiledesk Telegram Connector!')
})

router.get('/detail', async (req, res) => {

  winston.verbose("(tgm) /detail")
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
      winston.error("(tgm) Read html file error: ", err);
    }

    var template = handlebars.compile(html);
    var replacements = {
      app_version: pjson.version,
      project_id: projectId,
      token: token,
      app_id: app_id,
      installed: installed
    }
    var html = template(replacements);
    res.send(html);
  })
})

router.post('/install', async (req, res) => {
  winston.verbose("(tgm) /install");
  let project_id = req.body.project_id;
  let app_id = req.body.app_id;
  let token = req.body.token;

  winston.verbose("(tgm) Install app " + app_id + " for project id " + project_id);
  let installation_info = {
    project_id: project_id,
    app_id: app_id,
    createdAt: Date.now()
  };

  const appClient = new TiledeskAppsClient({ APPS_API_URL: APPS_API_URL });
  appClient.install(installation_info).then((installation) => {

    winston.debug("(tgm) installation response: ", installation);

    let installed = true;

    readHTMLFile('/detail.html', (err, html) => {
      if (err) {
        winston.error("(tgm) Read html file error: ", err);
      }

      var template = handlebars.compile(html);
      var replacements = {
        app_version: pjson.version,
        project_id: project_id,
        token: token,
        app_id: app_id,
        installed: installed
      }
      var html = template(replacements);
      res.send(html);
    })

  }).catch((err) => {
    winston.error("(tgm) installation error: ", err.data)
    res.send("An error occurred during the installation");
  })

})

router.post('/uninstall', async (req, res) => {
  winston.verbose("(tgm) /uninstall");
  let project_id = req.body.project_id;
  let app_id = req.body.app_id;
  let token = req.body.token;

  const appClient = new TiledeskAppsClient({ APPS_API_URL: APPS_API_URL });
  appClient.uninstall(project_id, app_id).then((response) => {

    winston.debug("(tgm) uninstallation response: ", response);

    let installed = false;

    readHTMLFile('/detail.html', (err, html) => {
      if (err) {
        winston.error("(tgm) Read html file error: ", err);
      }

      var template = handlebars.compile(html);
      var replacements = {
        app_version: pjson.version,
        project_id: project_id,
        token: token,
        app_id: app_id,
        installed: installed
      }
      var html = template(replacements);
      res.send(html);
    })

  }).catch((err) => {
    winston.error("(tgm) uninsallation error: ", err.data)
    res.send("An error occurred during the uninstallation");
  })
})

router.get('/configure', async (req, res) => {
  winston.verbose("(tgm) /configure")
  winston.debug("(tgm) query: ", req.query);

  let projectId = "";
  let token = "";

  projectId = req.query.project_id;
  token = req.query.token;

  if (!projectId || !token) {
    let error_message = "Query params project_id and token are required."
    readHTMLFile('/error.html', (err, html) => {
      var template = handlebars.compile(html);

      var replacements = {
        app_version: pjson.version,
        error_message: error_message
      }
      var html = template(replacements);
      return res.send(html);
    })
    return
  }

  let CONTENT_KEY = "telegram-" + projectId;

  let settings = await db.get(CONTENT_KEY);
  winston.debug("(tgm) settings found: ", settings)

  // get departments
  const tdChannel = new TiledeskChannel({ settings: { project_id: projectId, token: token }, API_URL: API_URL })
  let departments = await tdChannel.getDepartments(token);
  winston.debug("(tgm) found " + departments.length + " departments")

  if (settings) {
    var replacements = {
      app_version: pjson.version,
      project_id: projectId,
      token: token,
      bot_name: settings.bot_name,
      telegram_token: settings.telegram_token,
      subscriptionId: settings.subscriptionId,
      show_info_message: settings.show_info_message,
      department_id: settings.department_id,
      departments: departments
    }
  } else {
    var replacements = {
      app_version: pjson.version,
      project_id: projectId,
      token: token,
      departments: departments
    }
  }

  readHTMLFile('/configure.html', (err, html) => {
    if (err) {
      winston.error("(tgm) Read html file error: ", err);
    }
    var template = handlebars.compile(html);
    var html = template(replacements);
    res.send(html);
  })

})

router.post('/update', async (req, res) => {
  winston.verbose("(tgm) update");
  winston.debug("(tgm) body: ", req.body);

  let projectId = req.body.project_id;
  let token = req.body.token;
  let telegram_token = req.body.telegram_token;
  let bot_name = req.body.bot_name;
  let department_id = req.body.department;

  let CONTENT_KEY = "telegram-" + projectId;
  let settings = await db.get(CONTENT_KEY);

  const tdChannel = new TiledeskChannel({ settings: { project_id: projectId, token: token }, API_URL: API_URL })
  let departments = await tdChannel.getDepartments(token);

  if (settings) {
    settings.bot_name = bot_name;
    settings.telegram_token = telegram_token;
    settings.department_id = department_id;

    await db.set(CONTENT_KEY, settings);

    readHTMLFile('/configure.html', (err, html) => {
      if (err) {
        winston.error("(tgm) Read html file error: ", err);
      }

      var template = handlebars.compile(html);
      var replacements = {
        app_version: pjson.version,
        project_id: settings.project_id,
        token: settings.token,
        subscriptionId: settings.subscriptionId,
        bot_name: settings.bot_name,
        telegram_token: settings.telegram_token,
        show_info_message: settings.show_info_message,
        department_id: settings.department_id,
        departments: departments
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
      winston.debug("(tgm) subscription: ", subscription)

      // setWebhookEndpoint for Telegram
      const ttClient = new TiledeskTelegram({ BASE_URL: BASE_URL, TELEGRAM_API_URL: TELEGRAM_API_URL, log: true });

      ttClient.setWebhookEndpoint(projectId, telegram_token).then((response) => {
        winston.debug("(tgm) Set webhook endpoint response: ", response.result, response.description);

        let settings = {
          app_version: pjson.version,
          project_id: projectId,
          token: token,
          subscriptionId: subscription._id,
          secret: subscription.secret,
          bot_name: bot_name,
          telegram_token: telegram_token,
          department_id: department_id
        }

        db.set(CONTENT_KEY, settings);

        readHTMLFile('/configure.html', (err, html) => {
          if (err) {
            winston.error("(tgm) Read html file error: ", err);
          }

          var template = handlebars.compile(html);
          var replacements = {
            app_version: pjson.version,
            project_id: settings.project_id,
            token: settings.token,
            subscriptionId: settings.subscriptionId,
            bot_name: settings.bot_name,
            telegram_token: settings.telegram_token,
            show_info_message: settings.show_info_message,
            department_id: settings.department_id,
            departments: departments
          }
          var html = template(replacements);
          res.send(html);
        })

      }).catch((err) => {
        winston.error("(tgm) set webhook endpoint error: ", err);
      })

    }).catch((err) => {
      winston.error("(tgm) subscription error: ", err)
    })
  }
})

router.post('/update_advanced', async (req, res) => {
  winston.verbose("(tgm) /update");
  winston.debug("(tgm) body: ", req.body);

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
  winston.verbose("(tgm) /disconnect")
  winston.debug("(tgm) body: ", req.body)

  let projectId = req.body.project_id;
  let token = req.body.token;
  let subscriptionId = req.body.subscriptionId;

  let CONTENT_KEY = "telegram-" + projectId;
  await db.remove(CONTENT_KEY);
  winston.verbose("(tgm) Content deleted: ", CONTENT_KEY);

  const tdChannel = new TiledeskChannel({ settings: { project_id: projectId, token: token }, API_URL: API_URL })
  const tdClient = new TiledeskSubscriptionClient({ API_URL: API_URL, project_id: projectId, token: token, log: false })

  let departments = await tdChannel.getDepartments(token);

  tdClient.unsubscribe(subscriptionId).then((data) => {

    readHTMLFile('/configure.html', (err, html) => {

      if (err) {
        winston.error("(tgm) Read html file error: ", err);
      }

      var template = handlebars.compile(html);
      var replacements = {
        app_version: pjson.version,
        project_id: projectId,
        token: token,
        departments: departments
      }
      var html = template(replacements);
      res.send(html);
    })
  }).catch((err) => {
    winston.error("(tgm) unsubscribe error: ", err);
  })

})

router.post('/tiledesk', async (req, res) => {
  winston.verbose("(tgm) Message received from Tiledesk")
  winston.debug("(tgm) tiledeskChannelMessage: ", req.body.payload);

  var tiledeskChannelMessage = req.body.payload;
  let projectId = tiledeskChannelMessage.id_project;

  let attributes = req.body.payload.attributes;

  let commands;
  if (attributes && attributes.commands) {
    commands = attributes.commands;
  }


  let sender_id = tiledeskChannelMessage.sender;

  if (sender_id.indexOf("telegram") > -1) {
    winston.verbose("(tgm) Skip same sender");
    return res.sendStatus(200);
  }

  if (attributes && attributes.subtype === "info") {
    winston.verbose("(tgm) Skip subtype: " + attributes.subtype);
    return res.sendStatus(200);
  }

  let CONTENT_KEY = "telegram-" + projectId;
  let settings = await db.get(CONTENT_KEY);

  if (attributes && attributes.subtype === 'info/support') {
    // Temporary solve the bug of multiple lead update messages
    if (attributes.messagelabel.key == 'LEAD_UPDATED') {
      winston.debug("(tgm) Skip LEAD_UPDATED");
      return res.sendStatus(200);
    }

    if (!settings.show_info_message || settings.show_info_message == false) {
      return res.sendStatus(200);
    }
  }

  let recipient_id = tiledeskChannelMessage.recipient;
  let chat_id = recipient_id.substring(recipient_id.lastIndexOf("-") + 1);

  winston.debug("(tgm) attributes: " + attributes);
  winston.debug("(tgm) sender_id: " + sender_id);
  winston.debug("(tgm) chat_id: " + chat_id);

  const messageHandler = new MessageHandler({ tiledeskChannelMessage: tiledeskChannelMessage });
  const tlr = new TiledeskTelegramTranslator();
  const ttClient = new TiledeskTelegram({ BASE_URL: BASE_URL, TELEGRAM_API_URL: TELEGRAM_API_URL, log: true });

  if (commands) {
    let i = 0;
    async function execute(command) {
      //message
      if (command.type === 'message') {
        let tiledeskCommandMessage = await messageHandler.generateMessageObject(command);
        winston.debug("(tgm) message generated from commands: ", tiledeskCommandMessage);

        let telegramJsonMessage = await tlr.toTelegram(tiledeskCommandMessage, chat_id);
        winston.debug("(tgm) telegramJsonMessage", telegramJsonMessage)

        if (telegramJsonMessage) {
          ttClient.send(settings.telegram_token, telegramJsonMessage).then((response) => {
            winston.verbose("(tgm) Message sent to Telegram! " + response.status + " " + response.statusText);
            i += 1;
            if (i < commands.length) {
              execute(commands[i]);
            } else {
              winston.debug("(tgm) End of commands")
            }
          }).catch((err) => {
            winston.error("(tgm) send message error: ", err);
          })
          winston.verbose("(tgm) Message sent to Telegram")
        } else {
          winston.error("(tgm) telegramJsonMessage is undefined!");
        }
      }

      //wait
      if (command.type === "wait") {
        setTimeout(() => {
          i += 1;
          if (i < commands.length) {
            execute(commands[i]);
          } else {
            winston.debug("(tgm) End of commands")
          }
        }, command.time)
      }
    }
    execute(commands[0]);
  }

  else if (tiledeskChannelMessage.text || tiledeskChannelMessage.metadata) {

    let telegramJsonMessage = await tlr.toTelegram(tiledeskChannelMessage, chat_id);
    winston.debug("(tgm) telegramJsonMessage", telegramJsonMessage)

    if (telegramJsonMessage) {

      ttClient.send(settings.telegram_token, telegramJsonMessage).then((response) => {
        winston.verbose("(tgm) Message sent to Telegram! " + response.status + " " + response.statusText);
      }).catch((err) => {
        winston.error("(tgm) send message error: ", err);
      })
    }

  } else {
    winston.debug("(tgm) no command, no text --> skip");
  }

  return res.sendStatus(200);

  /*
  const telegramJsonMessage = await tlr.toTelegram(tiledeskChannelMessage, chat_id);
  winston.verbose("(tgm) telegramJsonMessage: ", telegramJsonMessage);

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
    winston.verbose("(tgm) Message sent to Telegram")
    return res.send(200);


  } else {
    winston.verbose("(tgm) telegramJsonMessage is undefined.");
  }
  */

})

router.post('/telegram', async (req, res) => {
  winston.verbose("(tgm) Message received from Telegram");
  winston.debug("(tgm) telegramChannelMessage: ", req.body);

  let projectId = req.query.project_id;

  if (!req.body.message && !req.body.callback_query) {
    winston.verbose("(tgm) Message or callback query undefined");
    return res.send({ message: "Message not sent" });
  }

  if (req.body.edited_message) {
    winston.verbose("(tgm) ignore edited message");
    return res.send({ message: "Edited messages are not supported. Message ignored." })
  }

  let telegramChannelMessage = req.body;

  let CONTENT_KEY = "telegram-" + projectId;

  let settings = await db.get(CONTENT_KEY);
  winston.debug("(tgm) settings found: ", settings);

  if (!settings) {
    winston.verbose("(tgm) No settings found. Exit..");
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
    winston.debug("(tgm) Edit message markup response: ", response.data);
  }

  const tlr = new TiledeskTelegramTranslator();
  let tiledeskJsonMessage;

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

  } else {
    tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage);
  }

  winston.debug("(tgm) tiledeskJsonMessage: ", tiledeskJsonMessage);

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
    const response = await tdChannel.send(tiledeskJsonMessage, message_info, settings.department_id);
    winston.verbose("(tgm) Message sent to Tiledesk! " + response.status + " " + response.statusText);

    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }

})


// *****************************
// ********* FUNCTIONS *********
// *****************************

function startApp(settings, callback) {
  winston.info("(tgm) Starting Telegram App: ");

  if (!settings.MONGODB_URL) {
    throw new Error("settings.MONGODB_URL is mandatory")
  }

  if (!settings.API_URL) {
    throw new Error("settings.API_URL is mandatory");
  } else {
    API_URL = settings.API_URL;
    winston.info("(tgm) API_URL: " + API_URL);
  }

  if (!settings.BASE_URL) {
    throw new Error("settings.BASE_URL is mandatory");
  } else {
    BASE_URL = settings.BASE_URL;
    winston.info("(tgm) BASE_URL: " + BASE_URL);
  }

  if (!settings.TELEGRAM_API_URL) {
    throw new Error("settings.TELEGRAM_API_URL is mandatory");
  } else {
    TELEGRAM_API_URL = settings.TELEGRAM_API_URL;
    winston.info("(tgm) TELEGRAM_API_URL: " + TELEGRAM_API_URL);
  }

  if (!settings.TELEGRAM_FILE_URL) {
    throw new Error("settings.TELEGRAM_API_URL is mandatory");
  } else {
    TELEGRAM_FILE_URL = settings.TELEGRAM_FILE_URL;
    winston.info("(tgm) TELEGRAM_FILE_URL: " + TELEGRAM_FILE_URL);
  }

  if (!settings.APPS_API_URL) {
    throw new Error("settings.APPS_API_URL is mandatory");
  } else {
    APPS_API_URL = settings.APPS_API_URL;
    winston.info("(tgm) APPS_API_URL: " + APPS_API_URL);
  }

  if (settings.log) {
    log = settings.log;
  }

  db.connect(settings.MONGODB_URL, () => {
    winston.info("(tgm) KVBaseMongo succesfully connected.");
    if (callback) {
      callback();
    }
  })
}

function readHTMLFile(templateName, callback) {
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