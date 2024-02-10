const { Schema, model } = require('mongoose');

module.exports = model('shorten', new Schema({
    code: String,
    url: String,
    count: {
        type: Number,
        required: true,
        default: 0,
    }
}));