"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const documentSchema = new mongoose_1.default.Schema({
    ownerId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    text: { type: String, required: true },
    translatedText: { type: String },
    languageDetected: { type: String },
    pdfUrl: { type: String },
    cloudinaryId: { type: String },
}, { timestamps: true });
exports.Document = mongoose_1.default.model('Document', documentSchema);
