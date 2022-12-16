const axios = require('axios').default;
const FormData = require('form-data');

class TiledeskTelegram {

  /**
   * Constructor for TiledeskTelegram
   *
   * @example
   * const { TiledeskTelegram } = require('tiledesk-telegram');
   * const twclient = new TiledeskTelegram({ BASE_URL: BASE_URL, telegram_token: telegram_token, TELEGRAM_API_URL: TELEGRAM_API_URL });
   * 
   * @param {Object} config JSON configuration.
   * @param {string} config BASE_URL Mandatory. The base url of this application.
   * @param {string} config.token Mandatory. Token required for authentication.
   * @param {string} config.TELEGRAM_API_URL Mandatory. Url for telegram api.
   * @param {boolean} options.log Optional. If true HTTP requests are logged.
   */

  constructor(config) {
    if (!config) {
      throw new Error('config is mandatory');
    }

    if (!config.BASE_URL) {
      throw new Error('config.BASE_URL is mandatory');
    }

    if (!config.TELEGRAM_API_URL) {
      throw new Error('config.TELEGRAM_API_URL is mandatory');
    }

    this.TELEGRAM_API_URL = config.TELEGRAM_API_URL;
    this.BASE_URL = config.BASE_URL;
    // others?

    this.log = false;
    if (config.log) {
      this.log = config.log;
      console.log("Log active: ", this.log);
    }

  }

  async sendMessage(telegram_token, message) {
    if (this.log) {
      console.log("[Tiledesk Telegram] Sending message...", message);
    } else {
      cosole.log("[Tiledesk Telegram] Seding message...");
    }

    return await axios({
      url: this.TELEGRAM_API_URL + `${telegram_token}/sendMessage`,
      headers: {
        "Content-Type": "application/json"
      },
      data: message,
      method: 'POST'
    }).then((response) => {
      console.log("[Tiledesk Telegram] Message sent!");
      return response;
    }).catch((err) => {
      console.error("[Tiledesk Telegram ERROR] Send message: ");
      throw err;
    })
  }


  async sendPhoto(telegram_token, message) {
    if (this.log) {
      console.log("[Tiledesk Telegram] Sending message...", message);
    } else {
      cosole.log("[Tiledesk Telegram] Seding message...");
    }

    return await axios({
      url: this.TELEGRAM_API_URL + `${telegram_token}/sendPhoto`,
      headers: {
        "Content-Type": "application/json"
      },
      data: message,
      method: 'POST'
    }).then((response) => {
      console.log("[Tiledesk Telegram] Photo message sent!");
      return response;
    }).catch((err) => {
      console.error("[Tiledesk Telegram ERROR] Send photo message: ");
      throw err;
    })
  }

  async sendVideo(telegram_token, message) {
    if (this.log) {
      console.log("[Tiledesk Telegram] Sending message...", message);
    } else {
      cosole.log("[Tiledesk Telegram] Seding message...");
    }

    return await axios({
      url: this.TELEGRAM_API_URL + `${telegram_token}/sendVideo`,
      headers: {
        "Content-Type": "application/json"
      },
      data: message,
      method: 'POST'
    }).then((response) => {
      console.log("[Tiledesk Telegram] Video message sent!");
      return response;
    }).catch((err) => {
      console.error("[Tiledesk Telegram ERROR] Send video message: ");
      throw err;
    })
  }

  async sendDocument(telegram_token, message) {
    if (this.log) {
      console.log("[Tiledesk Telegram] Sending message...", message);
    } else {
      cosole.log("[Tiledesk Telegram] Seding message...");
    }

    return await axios({
      url: this.TELEGRAM_API_URL + `${telegram_token}/sendDocument`,
      headers: {
        "Content-Type": "application/json"
      },
      data: message,
      method: 'POST'
    }).then((response) => {
      console.log("[Tiledesk Telegram] Document message sent!");
      return response;
    }).catch((err) => {
      console.error("[Tiledesk Telegram ERROR] Send document message: ");
      throw err;
    })
  }


  async setWebhookEndpoint(projectId, telegram_token, callback) {
    const URL = this.TELEGRAM_API_URL + `${telegram_token}/setwebhook`;
    const data = {
      "url": this.BASE_URL + `/telegram/?project_id=${projectId}`
    }
    const HTTPREQUEST = {
      url: URL,
      headers: {
        'Content-Type': 'application/json'
      },
      json: data,
      method: 'POST'
    };
    let promise = new Promise((resolve, reject) => {
      TiledeskTelegram.request(
        HTTPREQUEST,
        function(err, resbody) {
          if (err) {
            if (callback) {
              callback(err);
            }
            reject(err);
          }
          else {
            if (callback) {
              callback(null, resbody);
            }
            console.log("resbody: ", resbody);
            resolve(resbody);
          }
        }, true)
    })
    return promise;
  }


  async editMessageReplyMarkup(telegram_token, reply_markup_data, callback) {
    const URL = this.TELEGRAM_API_URL + `${telegram_token}/editMessageReplyMarkup`;
    const HTTPREQUEST = {
      url: URL,
      headers: {
        'Content-Type': 'application/json'
      },
      json: reply_markup_data,
      method: 'GET',
      //method: 'POST'
    };

    let promise = new Promise((resolve, reject) => {
      TiledeskTelegram.request(
        HTTPREQUEST,
        function(err, resbody) {
          if (err) {
            if (callback) {
              callback(err);
            }
            reject(err);
          }
          else {
            if (callback) {
              callback(null, resbody);
            }
            resolve(resbody);
          }
        }, true)
    })
    return promise;
  }


  async downloadMedia(telegram_token, mediaId) {
    console.log("[Tiledesk Telegram] Downloading media...")
    if (this.log) {
      console.log("[Tiledesk Telegram] Download media with id: ", mediaId);
    }

    return await axios({
      url: this.TELEGRAM_API_URL + `${telegram_token}/getFile?file_id=${mediaId}`,
      headers: {
        "Content-Type": "application/json",
      },
      method: "GET"
    }).then((response) => {
      console.log("[Tiledesk Telegram] Download complete");
      return response.data
    }).catch((err) => {
      console.error("[Tiledesk Telegram ERROR] Download failed!: ", err);
    })
  }


  // HTTP REQUEST
  static async request(options, callback, log) {
    if (this.log) {
      console.log("API URL: ", options.url);
      console.log("** Options: ", options);
    }
    console.log("API URL: ", options.url);
    console.log("** Options: ", options);
    return await axios({
      url: options.url,
      method: options.method,
      data: options.json,
      params: options.params,
      headers: options.headers
    }).then((res) => {
      if (this.log) {
        console.log("Response for url:", options.url);
        console.log("Response headers:\n", res.headers);
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

module.exports = { TiledeskTelegram }