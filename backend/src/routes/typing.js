"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const TypingHistory_1 = require("../models/TypingHistory");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    try {
        const { text, languageDetected, translatedText } = req.body;
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const history = new TypingHistory_1.TypingHistory({
            userId: req.user.userId,
            text,
            languageDetected,
            translatedText
        });
        await history.save();
        res.json({ message: 'History saved' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save history' });
    }
});
router.get('/history', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const history = await TypingHistory_1.TypingHistory.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(50);
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const result = await TypingHistory_1.TypingHistory.deleteOne({ _id: req.params.id, userId: req.user.userId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'History record not found' });
        }
        res.json({ message: 'History record deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete history' });
    }
});
exports.default = router;
