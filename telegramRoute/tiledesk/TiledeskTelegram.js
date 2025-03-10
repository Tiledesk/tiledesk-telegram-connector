const axios = require('axios').default;
const FormData = require('form-data');
const winston = require('../winston');

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
    }

  }

  async send(telegram_token, message) {
    return new Promise((resolve, reject) => {
      if (message.photo) {
        this.sendPhoto(telegram_token, message).then((response) => {
          resolve(response);
        }).catch((err) => {
          reject(err);
        })
      } 
      else if (message.video) {
        this.sendVideo(telegram_token, message).then((response) => {
          resolve(response);
        }).catch((err) => {
          reject(err);
        })
      } 
      else if (message.document) {
        this.sendDocument(telegram_token, message).then((response) => {
          resolve(response);
        }).catch((err) => {
          reject(err);
        })
      } else {
        this.sendMessage(telegram_token, message).then((response) => {
          resolve(response);
        }).catch((err) => {
          reject(err);
        })
      }
    })
  }

  async sendMessage(telegram_token, message) {
    winston.verbose("(tgm) [TiledeskTelegram] Sending message...");
    winston.debug("(tgm) [TiledeskTelegram] Sending message...", message);
    
    return await axios({
      url: this.TELEGRAM_API_URL + `${telegram_token}/sendMessage`,
      headers: {
        "Content-Type": "application/json"
      },
      data: message,
      method: 'POST'
    }).then((response) => {
      return response;
    }).catch((err) => {
      winston.error("(tgm) [TiledeskTelegram] send message error: ", err.response.data);
      return err;
    })
  }


  async sendPhoto(telegram_token, message) {
    winston.verbose("(tgm) [TiledeskTelegram] Sending message...");
    winston.debug("(tgm) [TiledeskTelegram] Sending message...", message);

    return await axios({
      url: this.TELEGRAM_API_URL + `${telegram_token}/sendPhoto`,
      headers: {
        "Content-Type": "application/json"
      },
      data: message,
      method: 'POST'
    }).then((response) => {
      return response;
    }).catch((err) => {
      winston.error("(tgm) [TiledeskTelegram] send photo message error: " + err);
      throw err;
    })
  }

  async sendVideo(telegram_token, message) {
    winston.verbose("(tgm) [TiledeskTelegram] Seding message...");
    winston.debug("(tgm) [TiledeskTelegram] Sending message...", message);

    return await axios({
      url: this.TELEGRAM_API_URL + `${telegram_token}/sendVideo`,
      headers: {
        "Content-Type": "application/json"
      },
      data: message,
      method: 'POST'
    }).then((response) => {
      return response;
    }).catch((err) => {
      winston.error("(tgm) [TiledeskTelegram] send video message error: " + err);
      return err;
    })
  }

  async sendDocument(telegram_token, message) {
    winston.verbose("(tgm) [TiledeskTelegram] Seding message...");
    winston.debug("(tgm) [TiledeskTelegram] Sending message...", message);

    return await axios({
      url: this.TELEGRAM_API_URL + `${telegram_token}/sendDocument`,
      headers: {
        "Content-Type": "application/json"
      },
      data: message,
      method: 'POST'
    }).then((response) => {
      return response;
    }).catch((err) => {
      winston.error("(tgm) [TiledeskTelegram] send document message error: " + err);
      return err;
    })
  }


  async setWebhookEndpoint(projectId, telegram_token, callback) {
    const URL = this.TELEGRAM_API_URL + `${telegram_token}/setwebhook`;
    const data = {
      "url": this.BASE_URL + `/telegram/?project_id=${projectId}`
    }
    console.log("data: ", data)
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
            resolve(resbody);
          }
        }, true)
    })
    return promise;
  }
  
  async deleteWebhookEndpoint(projectId, telegram_token, callback) {
    const URL = this.TELEGRAM_API_URL + `${telegram_token}/deleteWebhook`;
    const HTTPREQUEST = {
      url: URL,
      headers: {
        'Content-Type': 'application/json'
      },
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
      method: 'GET'
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
    winston.debug("(tgm) [TiledeskTelegram] Downloading media: ", mediaId)
    
    return await axios({
      url: this.TELEGRAM_API_URL + `${telegram_token}/getFile?file_id=${mediaId}`,
      headers: {
        "Content-Type": "application/json",
      },
      method: "GET"
    }).then((response) => {
      winston.verbose("(tgm) [TiledeskTelegram] Download complete");
      return response.data
    }).catch((err) => {
      winston.error("(tgm) [TiledeskTelegram] Download failed!: " + err);
      return err;
    })
  }


  // HTTP REQUEST
  static async request(options, callback, log) {
    
    return await axios({
      url: options.url,
      method: options.method,
      data: options.json,
      params: options.params,
      headers: options.headers
    }).then((res) => {
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
      winston.error("(tgm) [TiledeskTelegram] An error occured: ", err);
      if (callback) {
        callback("an error occured", null, null);
      }
    })
  }


}

module.exports = { TiledeskTelegram }