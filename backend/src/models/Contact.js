const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

contactSchema.index({ userId: 1, contactId: 1 }, { unique: true });

module.exports = { Contact: mongoose.model('Contact', contactSchema) };
