"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedDocument = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const sharedDocumentSchema = new mongoose_1.default.Schema({
    documentId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Document', required: true },
    senderId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    seen: { type: Boolean, default: false },
}, { timestamps: true });
exports.SharedDocument = mongoose_1.default.model('SharedDocument', sharedDocumentSchema);
