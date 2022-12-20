class TiledeskTelegramTranslator {

  /**
   * Constructor for TiledeskTelegramTranslator
   *
   * @example
   * const { TiledeskTelegramTranslator } = require('tiledesk-telegram-translator');
   * const tlr = new TiledeskTelegramTranslator({ TELEGRAM_FILE_URL: TELEGRAM_FILE_URL});
   * 
   * @param {Object} config JSON configuration.
   * @param {string} config.TELEGRAM_FILE_URL Mandatory. Url for telegram file.
   */

  static CHANNEL_NAME = "telegram";
  static TELEGRAM_FILE_BASE_URL = "https://api.telegram.org/file/bot"

  constructor() {

    this.log = true;

  }

  async toTelegram(tiledeskChannelMessage, telegram_receiver) {

    if (this.log) {
      console.log("[Translator] Tiledesk message: ", tiledeskChannelMessage);
    }

    let text = '';
    if (tiledeskChannelMessage.text) {
      text = tiledeskChannelMessage.text;
    }

    const telegram_message = {
      chat_id: telegram_receiver,
      parse_mode: "markdown"
    }


    // Metadata
    if (tiledeskChannelMessage.metadata) {

      if ((tiledeskChannelMessage.metadata.type && tiledeskChannelMessage.metadata.type.startsWith('image')) || tiledeskChannelMessage.type.startsWith('image')) {

        telegram_message.photo = tiledeskChannelMessage.metadata.src;
        telegram_message.caption = text;

      }

      else if ((tiledeskChannelMessage.metadata.type && tiledeskChannelMessage.metadata.type.startsWith('video')) || tiledeskChannelMessage.type.startsWith('video')) {

        telegram_message.video = tiledeskChannelMessage.metadata.src
        //telegram_message.caption = tiledeskChannelMessage.metadata.name || text;
        telegram_message.caption = text;
      }

      else if ((tiledeskChannelMessage.metadata.type && tiledeskChannelMessage.metadata.type.startsWith('application')) || tiledeskChannelMessage.type.startsWith('application')) {
      //else if (tiledeskChannelMessage.metadata.type.startsWith('application')) {

        telegram_message.document = tiledeskChannelMessage.metadata.src;
        //telegram_message.caption = tiledeskChannelMessage.text.substr(tiledeskChannelMessage.text.indexOf(')') + 1);  
        telegram_message.caption = tiledeskChannelMessage.text

      }

      else {
        console.log("\nfile type not supported");
      }

      if (this.log) {
        console.log("[Translator] telegram message: ", telegram_message)
      }
      return telegram_message;

    }


    else if (tiledeskChannelMessage.attributes) {
      if (tiledeskChannelMessage.attributes.attachment) {
        if (tiledeskChannelMessage.attributes.attachment.buttons) {

          let buttons = tiledeskChannelMessage.attributes.attachment.buttons;
          if (this.log) {
            console.log("Buttons: ", buttons);
          }

          // Issue: quick_replies and inline_buttons not supported togheter
          // Solution 1: create only inline_buttons 
          // Solution 2: send a message for type

          let quick_replies = [];   // not used at the moment
          let inline_buttons = [];

          // Loop on buttons
          for (let btn of buttons) {

            if (btn.type == 'url') {
              inline_buttons.push([{ text: btn.value, url: btn.link }])
            }

            if (btn.type == 'action') {
              let text_value = (btn.value.length > 36) ? btn.value.substr(0, 34) + '..' : btn.value;
              let cb_value = (btn.value.length > 36) ? btn.value.substr(0, 36) : btn.value;
              let action_btn = {
                type: 'action',
                action: cb_value
              }
              inline_buttons.push([{ text: text_value, callback_data: JSON.stringify(action_btn) }])
            }

            if (btn.type == 'text') {

              let text_value = (btn.value.length > 38) ? btn.value.substr(0, 36) + '..' : btn.value;
              let cb_value = (btn.value.length > 38) ? btn.value.substr(0, 38) : btn.value;
              let text_btn = {
                type: 'text',
                value: cb_value
              }
              inline_buttons.push([{ text: text_value, callback_data: JSON.stringify(text_btn) }])
            }
          }

          if (inline_buttons.length > 0) {
            telegram_message.text = tiledeskChannelMessage.text;
            telegram_message.reply_markup = {
              inline_keyboard: inline_buttons,
              resize_keyboard: true,
              one_time_keyboard: false
            }
          }

          if (this.log) {
            console.log("[Translator] telegram message: ", telegram_message)
          }
          return telegram_message;

          // For Solution 2
          // Loop on button of type = 'text' --> quick replies

          /*
          for (let btn of buttons) {
            if (btn.type == 'text') {
              quick_replies.push({ text: btn.value });
            }
          }
 
          const data3 = {
            chat_id: chatId,
          }
 
          if (quick_replies.length > 0) {
            if (inline_buttons.length == 0) {
              data3.text = payload.text;
            } else {
              data3.text = 'Here the problem'
            }
 
            data3.reply_markup = {
              keyboard: [
                quick_replies
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
            console.log("Data (Quick Replies): ", data3)
            console.log("Quick Replies: ", data3.reply_markup.keyboard)
 
            sendTelegramMessage(tg_token, data3).then((response) => {
              console.log("SendTelegramMessage Response (quick replies): ", response)
            }).catch((err) => {
              console.log("Error SendTelegramMessage (quick replies): ", err)
            })
          }
          */



        }

      } else {
        telegram_message.text = tiledeskChannelMessage.text;
        if (this.log) {
          console.log("[Translator] telegram message: ", telegram_message)
        }
        return telegram_message;
      }
    }

    else {
      telegram_message.text = tiledeskChannelMessage.text;
      if (this.log) {
        console.log("[Translator] telegram message: ", telegram_message)
      }
      return telegram_message;
    }



  }

  async toTiledesk(telegramChannelMessage, telegram_token, media_url) {
    console.log("[Translator] telegramChannelMessage: ", telegramChannelMessage);
    console.log("[Translator] telegramChannelMessage: ", JSON.stringify(telegramChannelMessage, null, 4))

    if (telegramChannelMessage.callback_query) {
      // callback query
      let callback = telegramChannelMessage.callback_query;
      let data = JSON.parse(callback.data)

      console.log("callback data: ", data);

      if (data.type === 'action') {
        var tiledeskMessage = {
          senderFullname: callback.from.first_name + " " + callback.from.last_name,
          text: ' ',
          type: 'text',
          attributes: {
            action: data.action,
            subtype: 'info'
          },
          channel: { name: TiledeskTelegramTranslator.CHANNEL_NAME }
        }
        return tiledeskMessage;

      } else {
        var tiledeskMessage = {
          text: data.value,
          senderFullname: callback.from.first_name + " " + callback.from.last_name,
          channel: { name: TiledeskTelegramTranslator.CHANNEL_NAME }
        }
        return tiledeskMessage;
      }


    }
    else if (telegramChannelMessage.message) {

      let message = telegramChannelMessage.message;

      // Photo
      if (message.photo) {
        let image_url = TiledeskTelegramTranslator.TELEGRAM_FILE_BASE_URL + `${telegram_token}/${media_url}`;
        let index = telegramChannelMessage.message.photo.length - 1;

        var msg = {
          text: message.caption || "Attached image",
          senderFullname: message.from.first_name + " " + message.from.last_name,
          channel: { name: TiledeskTelegramTranslator.CHANNEL_NAME },
          type: "image",
          metadata: {
            src: image_url,
            width: message.photo[index].width,
            height: message.photo[index].height,
          }
        }
        return msg;
      }

      // Video
      else if (message.video) {
        let video_url = TiledeskTelegramTranslator.TELEGRAM_FILE_BASE_URL + `${telegram_token}/${media_url}`;
        console.log("video url: ", video_url)

        var msg = {
          text: "[" + message.video.file_name + "](" + video_url + ")",
          senderFullname: message.from.first_name + " " + message.from.last_name,
          channel: { name: TiledeskTelegramTranslator.CHANNEL_NAME },
          type: "video",
          metadata: {
            src: video_url,
            name: message.video.file_name,
            type: message.video.mime_type
          }
        }
        return msg;

      }

      // Document
      else if (message.document) {
        let document_url = TiledeskTelegramTranslator.TELEGRAM_FILE_BASE_URL + `${telegram_token}/${media_url}`;

        var msg = {
          text: "[" + message.document.file_name + "](" + document_url + ")",
          senderFullname: message.from.first_name + " " + message.from.last_name,
          channel: { name: TiledeskTelegramTranslator.CHANNEL_NAME },
          type: "file",
          metadata: {
            name: message.document.file_name,
            type: message.document.mime_type,
            src: document_url
          }
        }
        return msg;
      }

      // Text message
      else {

        var msg = {
          text: telegramChannelMessage.message.text,
          senderFullname: message.from.first_name + " " + message.from.last_name,
          channel: { name: TiledeskTelegramTranslator.CHANNEL_NAME }
        }
        return msg;
      }

    }
    else {
      console.log("Format not supported!")
      return null;
    }

  }



  // HTTP REQUEST

  static async myrequest(options, callback, log) {
    if (this.log) {
      console.log("[Tiledesk Subscription Client] Options: ", options);
    }
    return await axios({
      url: options.url,
      method: options.method,
      data: options.json,
      params: options.params,
      headers: options.headers
    }).then((res) => {
      if (this.log) {
        console.log("[Tiledesk Subscription Client] Response headers:\n", res.headers);
      }
      if (res && res.status == 200 && res.data) {
        if (callback) {
          callback(null, res.data);
        }
      }
      else {
        if (callback) {
          callback(TiledeskClient.getErr({ message: "Response status not 200" }, options, res), null, null);
        }
      }
    }).catch((err) => {
      console.error("An error occured: ", err);
      if (callback) {
        callback(err, null, null);
      }
    })
  }

}

module.exports = { TiledeskTelegramTranslator }