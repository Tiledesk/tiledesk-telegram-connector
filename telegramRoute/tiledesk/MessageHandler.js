const winston = require('../winston');

class MessageHandler {

  constructor(config) {

    if (!config) {
      throw new Error('config is mandatory');
    }

    if (!config.tiledeskChannelMessage) {
      throw new Error('!config.telegramChannelMessage is mandatory');
    }

    this.tiledeskChannelMessage = config.tiledeskChannelMessage;
    this.log = false;
    if (config.log) {
      this.log = config.log;
    }
  }

  async generateMessageObject(command) {
    winston.debug("(telegram) [MessageHandler] command: ", command);
    let tiledeskCommandMessage = command.message;
    tiledeskCommandMessage.recipient = this.tiledeskChannelMessage.recipient;

    return tiledeskCommandMessage;
  }
}

module.exports = { MessageHandler }