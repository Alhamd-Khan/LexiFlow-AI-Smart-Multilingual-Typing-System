"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SharedDocument_1 = require("../models/SharedDocument");
const Document_1 = require("../models/Document");
const User_1 = require("../models/User");
const router = express_1.default.Router();
// Share a document
router.post('/', async (req, res) => {
    try {
        const { documentId, username } = req.body;
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const receiver = await User_1.User.findOne({ username });
        if (!receiver)
            return res.status(404).json({ error: 'User not found' });
        const doc = await Document_1.Document.findById(documentId);
        if (!doc || doc.ownerId.toString() !== req.user.userId) {
            return res.status(404).json({ error: 'Document not found or unauthorized' });
        }
        const shared = new SharedDocument_1.SharedDocument({
            documentId,
            senderId: req.user.userId,
            receiverId: receiver._id,
        });
        await shared.save();
        // In a real implementation we would emit via socket.io to the receiver here
        res.json({ message: 'Document shared successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Share failed' });
    }
});
// Get inbox (shared with me)
router.get('/inbox', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const sharedDocs = await SharedDocument_1.SharedDocument.find({ receiverId: req.user.userId }).populate('documentId').populate('senderId', 'username');
        res.json(sharedDocs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch inbox' });
    }
});
exports.default = router;
