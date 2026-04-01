"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const socket_1 = require("./socket");
dotenv_1.default.config({ override: true });
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
app.use((0, helmet_1.default)());
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'https://lexiflow-ai.vercel.app' // Fallback
].filter(Boolean);

app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json());
const auth_1 = __importDefault(require("./routes/auth"));
const ai_1 = __importDefault(require("./routes/ai"));
const documents_1 = __importDefault(require("./routes/documents"));
const shareRoutes = require("./routes/share");
const typingRoutes = require("./routes/typing");
const chatRoutes = require("./routes/chat");
const auth_2 = require("./middleware/auth");
const { cloudinary, ensureCloudinaryConfigured } = require("./config/cloudinary");
ensureCloudinaryConfigured();
// Routes
// Health Check for Render
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', auth_1.default);
app.use('/api/ai', ai_1.default);
app.get('/api/cloud-test', async (req, res) => {
    try {
        ensureCloudinaryConfigured();
        const ping = await cloudinary.api.ping();

        res.json({
            success: true,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            ping,
            message: 'Cloudinary connection is healthy'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Cloudinary connection failed',
            error: error.message
        });
    }
});
app.use('/api/documents', auth_2.authMiddleware, documents_1.default);
app.use('/api/share', auth_2.authMiddleware, shareRoutes.default || shareRoutes);
app.use('/api/typing', auth_2.authMiddleware, typingRoutes.default || typingRoutes);
app.use('/api/chat', auth_2.authMiddleware, chatRoutes.default || chatRoutes);
const PORT = process.env.PORT || 5000;
const rawMongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/lexiflow";
const MONGODB_URI = rawMongoUri.trim().replace(/^['\"]|['\"]$/g, "");

if (!/^mongodb(\+srv)?:\/\//i.test(MONGODB_URI)) {
    throw new Error("Invalid MONGODB_URI in environment. It must start with mongodb:// or mongodb+srv://");
}

mongoose_1.default.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        (0, socket_1.setupSocket)(httpServer);
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT} (0.0.0.0)`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });