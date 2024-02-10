const { Schema, model } = require('mongoose');

module.exports = model('codebin', new Schema({
    content: String,
    type: String,
    count: {
        type: Number,
        required: true,
        default: 0,
    }
}));