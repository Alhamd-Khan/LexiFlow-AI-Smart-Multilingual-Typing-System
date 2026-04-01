const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../models/User');
const { Message } = require('../models/Message');
const { Contact } = require('../models/Contact');

const router = express.Router();

// Get all users with last message, unread count, sorted by recency
router.get('/users', async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.userId);

    // Aggregate message stats per partner
    const messagedUsers = await Message.aggregate([
      { $match: { $or: [{ fromId: currentUserId }, { toId: currentUserId }] } },
      {
        $addFields: {
          partnerId: {
            $cond: { if: { $eq: ['$fromId', currentUserId] }, then: '$toId', else: '$fromId' }
          }
        }
      },
      {
        $group: {
          _id: '$partnerId',
          lastMessage: { $last: '$text' },
          lastMessageAt: { $last: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$toId', currentUserId] }, { $eq: ['$read', false] }] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Build a lookup map for message stats
    const statsMap = {};
    messagedUsers.forEach(mu => { statsMap[mu._id.toString()] = mu; });

    // Get ALL users except self
    const allUsers = await User.find({ _id: { $ne: currentUserId } }).select('username email');

    // Merge stats into each user
    const result = allUsers.map(u => {
      const stats = statsMap[u._id.toString()];
      return {
        _id: u._id,
        username: u.username,
        email: u.email,
        lastMessage: stats?.lastMessage || null,
        lastMessageAt: stats?.lastMessageAt || null,
        unreadCount: stats?.unreadCount || 0
      };
    });

    // Sort: users with messages first (by lastMessageAt desc), then alphabetically
    result.sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt) return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      return a.username.localeCompare(b.username);
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching users list:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Search for users
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    const users = await User.find({
      _id: { $ne: req.user.userId },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select('username email').limit(10);
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Add a user to contacts (bi-directional)
router.post('/add', async (req, res) => {
  try {
    const { contactId } = req.body;
    if (!contactId) return res.status(400).json({ error: 'contactId is required' });

    const userExists = await User.findById(contactId);
    if (!userExists) return res.status(404).json({ error: 'User not found' });

    await Contact.updateOne(
      { userId: req.user.userId, contactId },
      { userId: req.user.userId, contactId },
      { upsert: true }
    );
    await Contact.updateOne(
      { userId: contactId, contactId: req.user.userId },
      { userId: contactId, contactId: req.user.userId },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({ error: 'Failed to add contact' });
  }
});

// Mark all messages from a user as read
router.post('/read/:userId', async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const fromUserId = req.params.userId;
    await Message.updateMany(
      { fromId: fromUserId, toId: currentUserId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Get chat history with a specific user
router.get('/history/:userId', async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const targetUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { fromId: currentUserId, toId: targetUserId },
        { fromId: targetUserId, toId: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('fromId', 'username email')
      .populate('toId', 'username email');

    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      text: msg.text,
      fromId: msg.fromId._id,
      fromName: msg.fromId.username,
      toId: msg.toId._id,
      toName: msg.toId.username,
      createdAt: msg.createdAt,
      read: msg.read
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router;

