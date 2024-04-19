const mongodb = require("mongodb");
const winston = require('../winston');

class KVBaseMongo {

  /**
   * Constructor for KVBaseMongo object
   *
   * @example
   * const { KVBaseMongo } = require('./KVBaseMongo');
   * let db = new KVBaseMongo("kvstore");
   * 
   * @param {KVBASE_COLLECTION} The name of the Mongodb collection used as key-value store. Mandatory.
   */
  constructor(config) {
    if (!config.KVBASE_COLLECTION) {
      throw new Error('KVBASE_COLLECTION (the name of the Mongodb collection used as key-value store) is mandatory.');
    }
    this.KV_COLLECTION = config.KVBASE_COLLECTION;
    winston.verbose("KV_COLLECTION: ", this.KV_COLLECTION)

    this.log = false;
    if (config.log) {
      this.log = config.log;
    }
  }

  connect(MONGODB_URI, callback) {
    mongodb.MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
      if (err) {
        winston.error(err);
        process.exit(1);
      } else {
        this.db = client.db();
        this.db.collection(this.KV_COLLECTION).createIndex(
          { "key": 1 }, { unique: true }
        );
        callback();
      }
    });
  }
  
   reuseConnection(db, callback) {
    this.db = db;
    this.db.collection(this.KV_COLLECTION).createIndex(
      { "key": 1 }, { unique: true }
    )
    callback();
  }

  set(k, v) {
    return new Promise((resolve, reject) => {
      //this.db.set(k, v).then(() => {resolve();});
      this.db.collection(this.KV_COLLECTION).updateOne({key: k}, { $set: { value: v, key: k } }, { upsert: true }, function(err, doc) {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    });
  }

  get(k) {
    return new Promise((resolve, reject) => {
      //this.db.get(k).then(value => {resolve(value)});
      //console.log("Searching on ", this.db)
      winston.debug("Searching on Collection", this.KV_COLLECTION)
      
      this.db.collection(this.KV_COLLECTION).findOne({ key: k }, function(err, doc) {
        if (err) {
          winston.error("Error reading mongodb value", err);
          reject(err);
        }
        else {
          if (doc) {
            winston.debug("Doc found with key: ", doc.key);
            resolve(doc.value);
          }
          else {
            winston.verbose("No Doc found!");
            resolve(null);
          }
        }
      });
    });
  }

  remove(k) {
    return new Promise((resolve, reject) => {
      this.db.collection(this.KV_COLLECTION).deleteOne({key: k}, function(err) {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    });
  }
}

module.exports = { KVBaseMongo };