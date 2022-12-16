var assert = require('assert');
const { TiledeskTelegramTranslator } = require('../tiledesk/TiledeskTelegramTranslator');
const log = true;

describe('Test Translator\n', function() {

  // TILEDESK >>>>>>>>> TELEGRAM


  it("Translates a TEXT message from Tiledesk to Telegram", async function() {

    let tiledeskChannelMessage = {
      text: 'Test Message',
      recipient: 'support-group-62c3f10152dc7400352bab0d-86a2293e-telegram-238070007',
      attributes: {
        userFullname: 'John Doe'
      }
    }
    let telegram_receiver = tiledeskChannelMessage.recipient.substring(tiledeskChannelMessage.recipient.lastIndexOf("-") + 1);

    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const telegramJsonMessage = await tlr.toTelegram(tiledeskChannelMessage, telegram_receiver);
    assert(telegramJsonMessage != null);
    assert(telegramJsonMessage.parse_mode === "markdown");
    assert(telegramJsonMessage.chat_id === telegram_receiver);
    assert(telegramJsonMessage.text);
    assert(telegramJsonMessage.text == tiledeskChannelMessage.text);
    if (log) {
      console.log("\n(test) telegramJsonMessage: ", telegramJsonMessage);
    }
  })


  it("Translates a message containing an IMAGE from Tiledesk to Telegram", async function() {

    let tiledeskChannelMessage = {
      text: 'Test Message',
      type: 'image',
      recipient: 'support-group-62c3f10152dc7400352bab0d-86a2293e-telegram-238070007',
      metadata: {
        src: 'https://fakeimageurl.com/',
        type: 'image/png'
      },
      attributes: {
        userFullname: 'John Doe'
      }
    }
    let telegram_receiver = tiledeskChannelMessage.recipient.substring(tiledeskChannelMessage.recipient.lastIndexOf("-") + 1);

    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const telegramJsonMessage = await tlr.toTelegram(tiledeskChannelMessage, telegram_receiver);
    assert(telegramJsonMessage != null);
    assert(telegramJsonMessage.parse_mode === "markdown");
    assert(telegramJsonMessage.chat_id === telegram_receiver);
    assert(telegramJsonMessage.photo === tiledeskChannelMessage.metadata.src);
    assert(telegramJsonMessage.caption === tiledeskChannelMessage.text);
    if (log) {
      console.log("\n(test) telegramJsonMessage: ", telegramJsonMessage);
    }

  })


  it("Translates a message containing a VIDEO message from Tiledesk to Telegram", async function() {

    let tiledeskChannelMessage = {
      text: 'Video Caption',
      type: 'video',
      recipient: 'support-group-62c3f10152dc7400352bab0d-86a2293e-telegram-238070007',
      metadata: {
        src: 'https://fakevideourl.com/',
        type: 'video/mp4',
        name: 'fakevideo.mp4'
      },
      attributes: {
        userFullname: 'John Doe'
      }
    }
    let telegram_receiver = tiledeskChannelMessage.recipient.substring(tiledeskChannelMessage.recipient.lastIndexOf("-") + 1);

    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const telegramJsonMessage = await tlr.toTelegram(tiledeskChannelMessage, telegram_receiver);
    assert(telegramJsonMessage != null);
    assert(telegramJsonMessage.parse_mode === "markdown");
    assert(telegramJsonMessage.chat_id === telegram_receiver);
    assert(telegramJsonMessage.video != null);
    assert(telegramJsonMessage.video === tiledeskChannelMessage.metadata.src);
    assert(telegramJsonMessage.caption != null);
    assert(telegramJsonMessage.caption === tiledeskChannelMessage.text);
    if (log) {
      console.log("\n(test) telegramJsonMessage: ", telegramJsonMessage);
    }

  })


  it("Translates a message containing a DOCUMENT from Tiledesk to Telegram", async function() {

    let tiledeskChannelMessage = {
      text: 'Document Caption',
      type: 'file',
      recipient: 'support-group-62c3f10152dc7400352bab0d-86a2293e-telegram-238070007',
      metadata: {
        src: 'https://fakedocumenturl.com/',
        type: 'application/pdf',
        name: 'fakedocument.pdf'
      },
      attributes: {
        userFullname: 'John Doe'
      }
    }
    let telegram_receiver = tiledeskChannelMessage.recipient.substring(tiledeskChannelMessage.recipient.lastIndexOf("-") + 1);

    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const telegramJsonMessage = await tlr.toTelegram(tiledeskChannelMessage, telegram_receiver);
    assert(telegramJsonMessage != null);
    assert(telegramJsonMessage.parse_mode === "markdown");
    assert(telegramJsonMessage.chat_id === telegram_receiver);
    assert(telegramJsonMessage.document != null);
    assert(telegramJsonMessage.document === tiledeskChannelMessage.metadata.src);
    assert(telegramJsonMessage.caption != null);
    assert(telegramJsonMessage.caption === tiledeskChannelMessage.text);
    if (log) {
      console.log("\n(test) telegramJsonMessage: ", telegramJsonMessage);
    }

  })


  it("Translates a message with BUTTONS from Tiledesk to Telegram", async function() {

    let tiledeskChannelMessage = {
      text: 'Test Message',
      recipient: 'support-group-62c3f10152dc7400352bab0d-86a2293e-wab-104777398965560-393484506627',
      attributes: {
        attachment: {
          buttons: [
            { type: 'text', value: 'Button 1' },
            { type: 'url', value: 'Url 1' },
            { type: 'action', value: '↩︎ Back', action: 'main_menu' }
          ]
        }
      }
    }
    let telegram_receiver = tiledeskChannelMessage.recipient.substring(tiledeskChannelMessage.recipient.lastIndexOf("tel") + 3)
    let btn = {
      type: tiledeskChannelMessage.attributes.attachment.buttons[0].type,
      value: tiledeskChannelMessage.attributes.attachment.buttons[0].value
    }
    let callback_data = JSON.stringify(btn);


    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const telegramJsonMessage = await tlr.toTelegram(tiledeskChannelMessage, telegram_receiver);
    assert(telegramJsonMessage != null);
    assert(telegramJsonMessage.parse_mode === "markdown");
    assert(telegramJsonMessage.chat_id === telegram_receiver);
    assert(telegramJsonMessage.text === tiledeskChannelMessage.text);
    assert(telegramJsonMessage.reply_markup != null);
    assert(telegramJsonMessage.reply_markup.inline_keyboard != null);
    assert(telegramJsonMessage.reply_markup.inline_keyboard.length === 3);
    assert(telegramJsonMessage.reply_markup.inline_keyboard[0][0].text === tiledeskChannelMessage.attributes.attachment.buttons[0].value);
    assert(telegramJsonMessage.reply_markup.inline_keyboard[0][0].callback_data != null);
    assert(telegramJsonMessage.reply_markup.inline_keyboard[0][0].callback_data === callback_data);
    if (log) {
      console.log("\n(test) telegramJsonMessage: ", telegramJsonMessage);
    }

  })


  // TELEGRAM >>>>>>>>> TILEDESK


  it("Translates a TEXT message from Telegram to Tiledesk", async function() {
    let telegramChannelMessage = {
      message: {
        from: {
          first_name: "John",
          last_name: "Doe",
        },
        text: "Test Message"
      }
    }

    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage);
    assert(tiledeskJsonMessage != null);
    assert(tiledeskJsonMessage.text = telegramChannelMessage.message.text);
    assert(tiledeskJsonMessage.senderFullname === telegramChannelMessage.message.from.first_name + " " + telegramChannelMessage.message.from.last_name);
    assert(tiledeskJsonMessage.channel != null);
    assert(tiledeskJsonMessage.channel.name === TiledeskTelegramTranslator.CHANNEL_NAME);
    if (log) {
      console.log("(test) tiledeskJsonMessage: ", tiledeskJsonMessage);
    }
  })


  it("Translates a message with CALLBACK_QUERY (text button) from Telegram to Tiledesk", async function() {

    let telegramChannelMessage = {
      callback_query: {
        from: {
          first_name: "John",
          last_name: "Doe",
        },
        data: '{"type":"text","value":"Button 1"}'
      }
    }
    let data = JSON.parse(telegramChannelMessage.callback_query.data);

    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage);
    assert(tiledeskJsonMessage != null);
    assert(tiledeskJsonMessage.text === data.value);
    assert(tiledeskJsonMessage.senderFullname === telegramChannelMessage.callback_query.from.first_name + " " + telegramChannelMessage.callback_query.from.last_name);
    assert(tiledeskJsonMessage.channel.name === TiledeskTelegramTranslator.CHANNEL_NAME);
    if (log) {
      console.log("(test) tiledeskJsonMessage: ", tiledeskJsonMessage);
    }

  })


  it("Translates a message with CALLBACK_QUERY (action button) from Telegram to Tiledesk", async function() {
    let telegramChannelMessage = {
      callback_query: {
        from: {
          first_name: "John",
          last_name: "Doe",
        },
        data: '{"type":"action","action":"↩︎ Back"}'
      }
    }
    let data = JSON.parse(telegramChannelMessage.callback_query.data);

    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage);
    assert(tiledeskJsonMessage != null);
    assert(tiledeskJsonMessage.text === ' ');
    assert(tiledeskJsonMessage.type === 'text');
    assert(tiledeskJsonMessage.attributes != null);
    assert(tiledeskJsonMessage.attributes.subtype === 'info');
    assert(tiledeskJsonMessage.attributes.action === data.action);
    assert(tiledeskJsonMessage.senderFullname === telegramChannelMessage.callback_query.from.first_name + " " + telegramChannelMessage.callback_query.from.last_name);
    assert(tiledeskJsonMessage.channel.name === TiledeskTelegramTranslator.CHANNEL_NAME);
    if (log) {
      console.log("(test) tiledeskJsonMessage: ", tiledeskJsonMessage);
    }
  })


  it("Translates a message with an IMAGE from Telegram to Tiledesk", async function() {

    let telegramChannelMessage = {
      message: {
        from: {
          first_name: "John",
          last_name: "Doe",
        },
        photo: [
          {
            file_id: "AgACAgQAAxkBAAIEKGNWqcQrqlkpgggIsrEaXSwAAlOUAAKVuzEbmy65UksGxHJfOuPNAQADAgADcwADKgQ",
            file_unique_id: "AQADlbsxG5suuVJ4",
            file_size: 1116,
            width: 90,
            height: 90
          },
          {
            file_id: "AgACAgQAAxkBAAIEKGNWqcQrqlkpgggIsrEaXSwAAlOUAAKVuzEbmy65UksGxHJfOuPNAQADAgADbQADKgQ",
            file_unique_id: "AQADlbsxG5suuVJy",
            file_size: 7548,
            width: 320,
            height: 320
          },
          {
            file_id: "AgACAgQAAxkBAAIEKGNWqcQrqlkpgggIsrEaXSwAAlOUAAKVuzEbmy65UksGxHJfOuPNAQADAgADeAADKgQ",
            file_unique_id: "AQADlbsxG5suuVJ9",
            file_size: 10412,
            width: 512,
            height: 512
          }
        ]
      }
    }
    let file_path = "photos/file_6.jpg";
    let telegram_token = "test-telegram-token"

    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage, telegram_token, file_path);
    assert(tiledeskJsonMessage != null);
    assert(tiledeskJsonMessage.text != null);
    assert(tiledeskJsonMessage.text === "Attached image");
    assert(tiledeskJsonMessage.senderFullname === telegramChannelMessage.message.from.first_name + " " + telegramChannelMessage.message.from.last_name);
    assert(tiledeskJsonMessage.type === 'image');
    assert(tiledeskJsonMessage.metadata != null);
    assert(tiledeskJsonMessage.metadata.src === TiledeskTelegramTranslator.TELEGRAM_FILE_BASE_URL + telegram_token + "/" + file_path);
    if (log) {
      console.log("(test) tiledeskJsonMessage: ", tiledeskJsonMessage);
    }
  })

  it("Translates a message with an IMAGE from Telegram to Tiledesk", async function() {

    let telegramChannelMessage = {
      message: {
        from: {
          first_name: "John",
          last_name: "Doe",
        },
        photo: [
          {
            file_id: "AgACAgQAAxkBAAIEKGNWqcQrqlkpgggIsrEaXSwAAlOUAAKVuzEbmy65UksGxHJfOuPNAQADAgADcwADKgQ",
            file_unique_id: "AQADlbsxG5suuVJ4",
            file_size: 1116,
            width: 90,
            height: 90
          },
          {
            file_id: "AgACAgQAAxkBAAIEKGNWqcQrqlkpgggIsrEaXSwAAlOUAAKVuzEbmy65UksGxHJfOuPNAQADAgADbQADKgQ",
            file_unique_id: "AQADlbsxG5suuVJy",
            file_size: 7548,
            width: 320,
            height: 320
          },
          {
            file_id: "AgACAgQAAxkBAAIEKGNWqcQrqlkpgggIsrEaXSwAAlOUAAKVuzEbmy65UksGxHJfOuPNAQADAgADeAADKgQ",
            file_unique_id: "AQADlbsxG5suuVJ9",
            file_size: 10412,
            width: 512,
            height: 512
          }
        ],
        caption: "Test Caption"
      }
    }
    let file_path = "photos/file_6.jpg";
    let telegram_token = "test-telegram-token"

    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage, telegram_token, file_path);
    assert(tiledeskJsonMessage != null);
    assert(tiledeskJsonMessage.text != null);
    assert(tiledeskJsonMessage.text === telegramChannelMessage.message.caption);
    assert(tiledeskJsonMessage.senderFullname === telegramChannelMessage.message.from.first_name + " " + telegramChannelMessage.message.from.last_name);
    assert(tiledeskJsonMessage.type === 'image');
    assert(tiledeskJsonMessage.metadata != null);
    assert(tiledeskJsonMessage.metadata.src === TiledeskTelegramTranslator.TELEGRAM_FILE_BASE_URL + telegram_token + "/" + file_path);
    if (log) {
      console.log("(test) tiledeskJsonMessage: ", tiledeskJsonMessage);
    }
  })


  it("Translates a message with a VIDEO from Telegram to Tiledesk", async function() {

    let telegramChannelMessage = {
      message: {
        from: {
          first_name: "John",
          last_name: "Doe",
        },
        video: {
          duration: 29,
          width: 1280,
          height: 720,
          file_name: 'fake_video.mp4',
          mime_type: 'video/mp4',
          thumb: [Object],
          file_id: 'BAACAgQAAxkBAAIELGNWrOqLM9qg4WqVPHCWtB_13zRNAAIWDgACmy65UhuALt2Eeq5VKgQ',
          file_unique_id: 'AgADFg4AApsuuVI',
          file_size: 5253880
        }
      }
    }
    let file_path = "videos/file_X.mp4";
    let telegram_token = "test-telegram-token"

    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage, telegram_token, file_path);
    assert(tiledeskJsonMessage != null);
    assert(tiledeskJsonMessage.text != null);
    assert(tiledeskJsonMessage.type === 'video');
    assert(tiledeskJsonMessage.metadata != null);
    assert(tiledeskJsonMessage.metadata.src === TiledeskTelegramTranslator.TELEGRAM_FILE_BASE_URL + telegram_token + "/" + file_path);
    assert(tiledeskJsonMessage.metadata.name === telegramChannelMessage.message.video.file_name);
    assert(tiledeskJsonMessage.metadata.type === telegramChannelMessage.message.video.mime_type);
    assert(tiledeskJsonMessage.text === '[' + telegramChannelMessage.message.video.file_name + '](' + TiledeskTelegramTranslator.TELEGRAM_FILE_BASE_URL + telegram_token + "/" + file_path + ')')
    if (log) {
      console.log("(test) tiledeskJsonMessage: ", tiledeskJsonMessage);
    }

  })


  it("Translates a message with a DOCUMENT from Telegram to Tiledesk", async function() {
    let telegramChannelMessage = {
      message: {
        from: {
          first_name: "John",
          last_name: "Doe",
        },
        document: {
          file_name: "fake_document.pdf",
          mime_type: "application/pdf",
          thumb: {
            file_id: "AAMCBAADGQEAAgQ2Y1a1G9RFbvq10qUS-KhsljUYiB4AAiMOAAKbLrlS4RjZ3vuL478BAAdtAAMqBA",
            file_unique_id: "AQADIw4AApsuuVJy",
            file_size: 14824,
            width: 226,
            height: 320
          },
          file_id: "BQACAgQAAxkBAAIENmNWtRvURW76tdKlEviobJY1GIgeAAIjDgACmy65UuEY2d77i-O_KgQ",
          file_unique_id: "AgADIw4AApsuuVI",
          file_size: 702874
        }
      }
    }
    let file_path = "documents/file_X.mp4";
    let telegram_token = "test-telegram-token"

    const tlr = new TiledeskTelegramTranslator();
    assert(tlr != null);
    const tiledeskJsonMessage = await tlr.toTiledesk(telegramChannelMessage, telegram_token, file_path);
    assert(tiledeskJsonMessage != null);
    assert(tiledeskJsonMessage.text != null);
    assert(tiledeskJsonMessage.type === 'file');
    assert(tiledeskJsonMessage.metadata != null);
    assert(tiledeskJsonMessage.metadata.src === TiledeskTelegramTranslator.TELEGRAM_FILE_BASE_URL + telegram_token + "/" + file_path);
    assert(tiledeskJsonMessage.metadata.name === telegramChannelMessage.message.document.file_name);
    assert(tiledeskJsonMessage.metadata.type === telegramChannelMessage.message.document.mime_type);
    assert(tiledeskJsonMessage.text === '[' + telegramChannelMessage.message.document.file_name + '](' + TiledeskTelegramTranslator.TELEGRAM_FILE_BASE_URL + telegram_token + "/" + file_path + ')')
    if (log) {
      console.log("(test) tiledeskJsonMessage: ", tiledeskJsonMessage);
    }

  })
})