const mongoose = require('mongoose');

const SettingSchema = mongoose.Schema({
    projectId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    subscriptionId: {
        type: String,
        required: true
    },
    secret: {
        type: String,
        required: true
    },
    botName: {
        type: String,
        required: true
    },
    tgToken: {
        type: String,
        required: true
    }
}, {
    collection: 'settings'
});

module.exports = mongoose.model('Setting', SettingSchema);