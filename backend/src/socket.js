"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const socket_io_1 = require("socket.io");
const { Message } = require("./models/Message");
const setupSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        // Join personal room based on userId (passed in query or auth)
        const userId = socket.handshake.query.userId;
        if (userId) {
            socket.join(userId);
            console.log(`Socket ${socket.id} joined room: ${userId}`);
        } else {
            console.log(`Socket ${socket.id} connected without userId in query`);
        }
        socket.on('chat:message', async (data) => {
            console.log(`Received message from ${data.fromId} to ${data.toId}`);
            // data: { toId, text, fromId, ... }
            if (data.toId && data.fromId && data.text) {
                try {
                    // Save to DB
                    const newMessage = new Message({
                        fromId: data.fromId,
                        toId: data.toId,
                        text: data.text
                    });
                    await newMessage.save();
                    console.log(`Saved message ${newMessage._id} to DB`);

                    // Emit to recipient
                    const rooms = io.sockets.adapter.rooms;
                    console.log(`Room ${data.toId} has ${rooms.get(data.toId)?.size || 0} participants`);
                    
                    io.to(data.toId).emit('chat:message', {
                        ...data,
                        _id: newMessage._id,
                        createdAt: newMessage.createdAt
                    });
                    console.log(`Emitted message to room ${data.toId}`);
                } catch (error) {
                    console.error('Error in chat:message handler:', error);
                }
            } else {
                 console.log("Invalid message data received:", data);
            }
        });

        socket.on('chat:typing', (data) => {
            if (!data || !data.toId || !data.fromId) return;
            io.to(data.toId).emit('chat:typing', {
                fromId: data.fromId,
                toId: data.toId,
                isTyping: Boolean(data.isTyping),
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.setupSocket = setupSocket;
