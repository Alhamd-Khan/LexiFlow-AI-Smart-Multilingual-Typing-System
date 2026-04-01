"use strict";

const path = require("path");
const fs = require("fs");
const https = require("https");
const express = require("express");
const { Document } = require("../models/Document");
const { SharedDocument } = require("../models/SharedDocument");
const PdfPrinter = require("pdfmake");
const vfsFonts = require("pdfmake/build/vfs_fonts");
const { cloudinary, uploadBufferToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { JSDOM } = require("jsdom");
const htmlToPdfmake = require("html-to-pdfmake");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// ── Roboto (Latin scripts: English, Spanish, French, German, etc.) ─────────────
const roboto = {
    normal:      Buffer.from(vfsFonts.pdfMake.vfs["Roboto-Regular.ttf"],       "base64"),
    bold:        Buffer.from(vfsFonts.pdfMake.vfs["Roboto-Medium.ttf"],        "base64"),
    italics:     Buffer.from(vfsFonts.pdfMake.vfs["Roboto-Italic.ttf"],        "base64"),
    bolditalics: Buffer.from(vfsFonts.pdfMake.vfs["Roboto-MediumItalic.ttf"], "base64"),
};

// ── Universal Noto Sans font system ───────────────────────────────────────────
const FONTS_DIR = path.join(__dirname, "../assets/fonts");

// Font download helper
function downloadToFile(url, dest) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const file = fs.createWriteStream(dest);
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                file.close();
                fs.unlinkSync(dest);
                return downloadToFile(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
                return;
            }
            res.pipe(file);
            file.on("finish", () => file.close(resolve));
        }).on("error", (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

// Generic font loader with caching
const _fontCache = {};
const _fontPromises = {};

async function loadNotoFont(scriptName, regularUrl, boldUrl) {
    if (_fontCache[scriptName] !== undefined) return _fontCache[scriptName];
    if (_fontPromises[scriptName]) return _fontPromises[scriptName];

    _fontPromises[scriptName] = (async () => {
        try {
            await fs.promises.mkdir(FONTS_DIR, { recursive: true });
            const regPath = path.join(FONTS_DIR, `NotoSans${scriptName}-Regular.ttf`);
            const boldPath = path.join(FONTS_DIR, `NotoSans${scriptName}-Bold.ttf`);

            if (!fs.existsSync(regPath)) {
                console.log(`📥 Downloading Noto Sans ${scriptName}…`);
                await downloadToFile(regularUrl, regPath);
                console.log(`✅ Noto Sans ${scriptName} downloaded.`);
            }
            if (boldUrl && !fs.existsSync(boldPath)) {
                await downloadToFile(boldUrl, boldPath);
            }

            const regular = fs.readFileSync(regPath);
            const bold = boldUrl && fs.existsSync(boldPath) ? fs.readFileSync(boldPath) : regular;
            _fontCache[scriptName] = {
                normal: regular,
                bold: bold,
                italics: regular,
                bolditalics: bold,
            };
            return _fontCache[scriptName];
        } catch (err) {
            console.warn(`⚠️  Noto Sans ${scriptName} unavailable:`, err.message);
            _fontCache[scriptName] = false;
            return false;
        }
    })();
    return _fontPromises[scriptName];
}

// Base URL for Noto fonts from Google Fonts GitHub
const NOTO_BASE = "https://github.com/google/fonts/raw/main/ofl";

// Script font definitions: { fontKey, regularUrl, boldUrl }
const SCRIPT_FONT_DEFS = {
    Devanagari: {
        fontKey: "NotoSansDevanagari",
        regularUrl: `${NOTO_BASE}/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    CJK: {
        fontKey: "NotoSansCJK",
        regularUrl: "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf",
        boldUrl: "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Bold.otf",
    },
    Arabic: {
        fontKey: "NotoSansArabic",
        regularUrl: `${NOTO_BASE}/notosansarabic/NotoSansArabic%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Bengali: {
        fontKey: "NotoSansBengali",
        regularUrl: `${NOTO_BASE}/notosansbengali/NotoSansBengali%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Tamil: {
        fontKey: "NotoSansTamil",
        regularUrl: `${NOTO_BASE}/notosanstamil/NotoSansTamil%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Telugu: {
        fontKey: "NotoSansTelugu",
        regularUrl: `${NOTO_BASE}/notosanstelugu/NotoSansTelugu%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Thai: {
        fontKey: "NotoSansThai",
        regularUrl: `${NOTO_BASE}/notosansthai/NotoSansThai%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Kannada: {
        fontKey: "NotoSansKannada",
        regularUrl: `${NOTO_BASE}/notosanskannada/NotoSansKannada%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Malayalam: {
        fontKey: "NotoSansMalayalam",
        regularUrl: `${NOTO_BASE}/notosansmalayalam/NotoSansMalayalam%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Gujarati: {
        fontKey: "NotoSansGujarati",
        regularUrl: `${NOTO_BASE}/notosansgujarati/NotoSansGujarati%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Gurmukhi: {
        fontKey: "NotoSansGurmukhi",
        regularUrl: `${NOTO_BASE}/notosansgurmukhi/NotoSansGurmukhi%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Sinhala: {
        fontKey: "NotoSansSinhala",
        regularUrl: `${NOTO_BASE}/notosanssinhala/NotoSansSinhala%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Lao: {
        fontKey: "NotoSansLao",
        regularUrl: `${NOTO_BASE}/notosanslao/NotoSansLao%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Khmer: {
        fontKey: "NotoSansKhmer",
        regularUrl: `${NOTO_BASE}/notosanskhmer/NotoSansKhmer%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    // Note: Tibetan font not available as static TTF from public sources — will fall back to Roboto
    Ethiopic: {
        fontKey: "NotoSansEthiopic",
        regularUrl: `${NOTO_BASE}/notosansethiopic/NotoSansEthiopic%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Myanmar: {
        fontKey: "NotoSansMyanmar",
        regularUrl: `${NOTO_BASE}/notosansmyanmar/NotoSansMyanmar%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Oriya: {
        fontKey: "NotoSansOriya",
        regularUrl: `${NOTO_BASE}/notosansoriya/NotoSansOriya%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Georgian: {
        fontKey: "NotoSansGeorgian",
        regularUrl: `${NOTO_BASE}/notosansgeorgian/NotoSansGeorgian%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
    Hebrew: {
        fontKey: "NotoSansHebrew",
        regularUrl: `${NOTO_BASE}/notosanshebrew/NotoSansHebrew%5Bwdth%2Cwght%5D.ttf`,
        boldUrl: null,
    },
};

// Map each language name → script key
const LANG_TO_SCRIPT = {
    "Hindi": "Devanagari", "Marathi": "Devanagari", "Nepali": "Devanagari", "Sanskrit": "Devanagari",
    "Mandarin Chinese": "CJK", "Chinese": "CJK", "Japanese": "CJK", "Korean": "CJK",
    "Arabic": "Arabic", "Urdu": "Arabic", "Persian (Farsi)": "Arabic", "Pashto": "Arabic",
    "Bengali": "Bengali",
    "Tamil": "Tamil",
    "Telugu": "Telugu",
    "Thai": "Thai",
    "Kannada": "Kannada",
    "Malayalam": "Malayalam",
    "Gujarati": "Gujarati",
    "Punjabi": "Gurmukhi",
    "Sinhala": "Sinhala",
    "Lao": "Lao",
    "Khmer": "Khmer",
    "Amharic": "Ethiopic", "Tigrinya": "Ethiopic",
    "Burmese": "Myanmar",
    "Odia": "Oriya",
    "Georgian": "Georgian",
    "Hebrew": "Hebrew",
    // All remaining languages use Roboto (Latin/Cyrillic/Greek): English, Spanish, French, German,
    // Russian, Ukrainian, Turkish, Vietnamese, Indonesian, Swahili, Polish, Czech, etc.
};

// Load the correct font for a language, returns { fontKey, fontData } or null (use Roboto)
async function getFontForLang(lang) {
    const script = LANG_TO_SCRIPT[lang];
    if (!script) return null; // Roboto covers it

    const def = SCRIPT_FONT_DEFS[script];
    if (!def) return null;

    const fontData = await loadNotoFont(script, def.regularUrl, def.boldUrl);
    if (!fontData) return null;
    return { fontKey: def.fontKey, fontData };
}

// Detect script from text content using Unicode ranges
function detectScriptFromText(text) {
    if (!text) return null;
    if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) return "Arabic";
    if (/[\u0900-\u097F]/.test(text)) return "Devanagari";
    if (/[\u0980-\u09FF]/.test(text)) return "Bengali";
    if (/[\u0B80-\u0BFF]/.test(text)) return "Tamil";
    if (/[\u0C00-\u0C7F]/.test(text)) return "Telugu";
    if (/[\u0E00-\u0E7F]/.test(text)) return "Thai";
    if (/[\u0C80-\u0CFF]/.test(text)) return "Kannada";
    if (/[\u0D00-\u0D7F]/.test(text)) return "Malayalam";
    if (/[\u0A80-\u0AFF]/.test(text)) return "Gujarati";
    if (/[\u0A00-\u0A7F]/.test(text)) return "Gurmukhi";
    if (/[\u0D80-\u0DFF]/.test(text)) return "Sinhala";
    if (/[\u0E80-\u0EFF]/.test(text)) return "Lao";
    if (/[\u1780-\u17FF]/.test(text)) return "Khmer";
    if (/[\u0F00-\u0FFF]/.test(text)) return "Tibetan";
    if (/[\u1200-\u137F]/.test(text)) return "Ethiopic";
    if (/[\u1000-\u109F]/.test(text)) return "Myanmar";
    if (/[\u0B00-\u0B7F]/.test(text)) return "Oriya";
    if (/[\u10A0-\u10FF]/.test(text)) return "Georgian";
    if (/[\u0590-\u05FF]/.test(text)) return "Hebrew";
    if (/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7A3]/.test(text)) return "CJK";
    return null;
}

// ── Strip Markdown so raw syntax never appears in the PDF ─────────────────────
function stripMarkdown(str) {
    if (!str) return "";
    return str
        .replace(/^#{1,6}\s+/gm,           "")       // headings
        .replace(/(\*\*|__)(.+?)\1/gs,     "$2")     // **bold** / __bold__
        .replace(/(\*|_)(.+?)\1/gs,        "$2")     // *italic* / _italic_
        .replace(/^[-*_]{2,}\s*$/gm,       "")       // horizontal rules (-- --- ***)
        .replace(/`{1,3}[^`]*`{1,3}/g,    "")       // inline/block code
        .replace(/^>\s*/gm,                "")       // blockquotes
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")  // links/images → keep label text
        .replace(/^[-*+]\s+/gm,            "• ")    // unordered bullets → •
        .trim();
}

// ── Build a PDF buffer (async: may download fonts first time for Hindi/CJK) ────
async function buildPdfBuffer({ title, text, translatedText, targetLang }) {
    const { window } = new JSDOM("");
    const hasHtml = (str) => /<\/?[a-z][\s\S]*>/i.test(str || "");
    
    // Process text: if it's HTML (from rich text editor) use html-to-pdfmake, else use raw stripMarkdown
    let parsedOriginal = text || "";
    if (hasHtml(parsedOriginal)) {
        // html-to-pdfmake generates pdfmake elements keeping basic styles like bold/italic
        parsedOriginal = htmlToPdfmake(parsedOriginal, { window });
    } else {
        parsedOriginal = stripMarkdown(text);
    }

    let parsedTranslated = translatedText || "";
    if (hasHtml(parsedTranslated)) {
        parsedTranslated = htmlToPdfmake(parsedTranslated, { window });
    } else {
        parsedTranslated = stripMarkdown(translatedText);
    }

    const langLabel = targetLang ? `Translated Text (${targetLang})` : "Translated Text";

    // Start with Roboto; dynamically add script-specific fonts as needed
    const fonts = { Roboto: roboto };
    let originalFont = "Roboto";
    let translatedFont = "Roboto";

    // Helper: load a script font and register it
    async function registerScriptFont(scriptKey) {
        const def = SCRIPT_FONT_DEFS[scriptKey];
        if (!def || fonts[def.fontKey]) return def ? def.fontKey : "Roboto";
        const fontData = await loadNotoFont(scriptKey, def.regularUrl, def.boldUrl);
        if (fontData) {
            fonts[def.fontKey] = fontData;
            return def.fontKey;
        }
        return "Roboto";
    }

    // Detect font for translated text (by language name or text content)
    if (parsedTranslated) {
        const fontResult = await getFontForLang(targetLang);
        if (fontResult) {
            fonts[fontResult.fontKey] = fontResult.fontData;
            translatedFont = fontResult.fontKey;
        } else {
            // Fallback: detect script from the translated text itself
            const detectedScript = detectScriptFromText(
                typeof parsedTranslated === "string" ? parsedTranslated : translatedText
            );
            if (detectedScript) {
                translatedFont = await registerScriptFont(detectedScript);
            }
        }
    }

    // Detect font for original text (by content analysis)
    const originalScript = detectScriptFromText(text || "");
    if (originalScript) {
        originalFont = await registerScriptFont(originalScript);
    }

    const content = [
        { text: title || "LexiFlow Document", style: "docTitle", alignment: "center", margin: [0, 0, 0, 20] },
        { text: "Original Text",  style: "sectionHeader", decoration: "underline", margin: [0, 0, 0, 6] },
        { stack: Array.isArray(parsedOriginal) ? parsedOriginal : [parsedOriginal], style: "body", font: originalFont, margin: [0, 0, 0, 20] },
    ];

    if (parsedTranslated) {
        content.push(
            {
                canvas: [{ type: "line", x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 0.5, lineColor: "#d1d5db" }],
                margin: [0, 0, 0, 14],
            },
            { text: langLabel, style: "sectionHeader", decoration: "underline", margin: [0, 0, 0, 6] },
            { stack: Array.isArray(parsedTranslated) ? parsedTranslated : [parsedTranslated], font: translatedFont, fontSize: 12, lineHeight: 1.5, color: "#1f2937" }
        );
    }

    const docDef = {
        content,
        defaultStyle: { font: "Roboto" },
        styles: {
            docTitle:      { fontSize: 22, bold: true },
            sectionHeader: { fontSize: 14, bold: true, color: "#4f46e5" },
            body:          { fontSize: 12, lineHeight: 1.5, color: "#1f2937" },
        },
        pageMargins: [50, 50, 50, 50],
    };

    const printer = new PdfPrinter(fonts);
    return new Promise((resolve, reject) => {
        const pdfDoc = printer.createPdfKitDocument(docDef);
        const chunks = [];
        pdfDoc.on("data",  (c) => chunks.push(c));
        pdfDoc.on("end",   ()  => resolve(Buffer.concat(chunks)));
        pdfDoc.on("error", reject);
        pdfDoc.end();
    });
}

// ── Cloudinary helpers ─────────────────────────────────────────────────────────
function streamCloudinaryPdf(pdfUrl, res, disposition) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", disposition);

    https.get(pdfUrl, (cloudRes) => {
        if (cloudRes.statusCode && cloudRes.statusCode >= 400) {
            return res.status(502).json({ error: "Failed to fetch PDF from Cloudinary" });
        }
        cloudRes.pipe(res);
    }).on("error", (err) => {
        console.error("PDF proxy error:", err);
        res.status(500).json({ error: "Failed to fetch PDF from Cloudinary" });
    });
}

function getCloudinaryDeliveryUrl(doc) {
    if (doc.cloudinaryId) {
        return cloudinary.utils.private_download_url(doc.cloudinaryId, "pdf", {
            resource_type: "raw",
            type: "upload",
            attachment: false,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
        });
    }
    return doc.pdfUrl;
}

// ── GET / — list user documents ───────────────────────────────────────────────
router.get("/", async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const docs = await Document.find({ ownerId: req.user.userId }).sort({ createdAt: -1 });
        res.json(docs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// ── POST /upload — generate PDF → upload to Cloudinary → save to DB ──────────
router.post("/upload", async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const { title, text, translatedText, languageDetected } = req.body;
        if (!title || !text) return res.status(400).json({ error: "title and text are required" });

        const pdfBuffer = await buildPdfBuffer({ title, text, translatedText, targetLang: languageDetected });

        const publicId = `doc_${req.user.userId}_${Date.now()}`;
        const { url, publicId: cloudinaryId } = await uploadBufferToCloudinary(pdfBuffer, { publicId });

        const newDoc = new Document({
            ownerId: req.user.userId,
            title: title || "Untitled",
            text,
            translatedText,
            languageDetected,
            pdfUrl: url,
            cloudinaryId,
        });
        await newDoc.save();

        console.log(`✅ PDF uploaded: ${url}`);
        res.json({ message: "Document saved and PDF uploaded to Cloudinary", document: newDoc });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Upload failed", details: error.message });
    }
});

// ── GET /download/:id — proxy-download PDF from Cloudinary ───────────────────
router.get("/download/:id", async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const userId = req.user.userId;

        // Check if owner
        let doc = await Document.findOne({ _id: req.params.id, ownerId: userId });
        
        // If not owner, check if shared with user
        if (!doc) {
            const isShared = await SharedDocument.findOne({ documentId: req.params.id, receiverId: userId });
            if (isShared) {
                doc = await Document.findById(req.params.id);
            }
        }

        if (!doc || !doc.pdfUrl) return res.status(404).json({ error: "Document not found or access denied" });

        const filename = `${(doc.title || "document").replace(/[^a-z0-9]/gi, "_")}.pdf`;
        const deliveryUrl = getCloudinaryDeliveryUrl(doc);
        streamCloudinaryPdf(deliveryUrl, res, `attachment; filename="${filename}"`);
    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ error: "Download failed" });
    }
});

// ── GET /view/:id — proxy-view PDF inline for iframe preview ─────────────────
router.get("/view/:id", async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const userId = req.user.userId;

        // Check if owner
        let doc = await Document.findOne({ _id: req.params.id, ownerId: userId });

        // If not owner, check if shared with user
        if (!doc) {
            const isShared = await SharedDocument.findOne({ documentId: req.params.id, receiverId: userId });
            if (isShared) {
                doc = await Document.findById(req.params.id);
            }
        }

        if (!doc || !doc.pdfUrl) return res.status(404).json({ error: "Document not found or access denied" });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const currentOrigin = req.headers.origin || frontendUrl;
        res.removeHeader("X-Frame-Options");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Content-Security-Policy", `frame-ancestors 'self' ${frontendUrl} ${currentOrigin} http://localhost:5173 http://localhost:5174 http://192.168.1.219:5173`);

        const filename = `${(doc.title || "document").replace(/[^a-z0-9]/gi, "_")}.pdf`;
        const deliveryUrl = getCloudinaryDeliveryUrl(doc);
        streamCloudinaryPdf(deliveryUrl, res, `inline; filename="${filename}"`);
    } catch (error) {
        console.error("View error:", error);
        res.status(500).json({ error: "View failed" });
    }
});

// ── DELETE /:id — remove from DB + Cloudinary ────────────────────────────────
router.delete("/:id", async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const doc = await Document.findOne({ _id: req.params.id, ownerId: req.user.userId });
        if (!doc) return res.status(404).json({ error: "Document not found" });

        if (doc.cloudinaryId) {
            try {
                await deleteFromCloudinary(doc.cloudinaryId, { resourceType: "raw" });
            } catch (e) {
                console.warn("Cloudinary delete warning:", e.message);
            }
        }

        await doc.deleteOne();
        res.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Delete failed" });
    }
});

// ── POST /pdf — direct download without saving (Editor "Download PDF") ────────
router.post("/pdf", async (req, res) => {
    try {
        const { text, translatedText, title, targetLang } = req.body;
        const pdfBuffer = await buildPdfBuffer({ title, text, translatedText, targetLang });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${title || "document"}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "PDF generation failed" });
    }
});

router.post("/extract", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const { buffer, originalname } = req.file;
        let extractedText = "";

        if (originalname.toLowerCase().endsWith(".pdf")) {
            const data = await pdfParse(buffer);
            extractedText = data.text;
        } else if (originalname.toLowerCase().endsWith(".docx")) {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
        } else if (originalname.toLowerCase().endsWith(".txt")) {
            extractedText = buffer.toString("utf8");
        } else {
            return res.status(400).json({ error: "Unsupported file format. Please upload PDF, DOCX, or TXT." });
        }

        res.json({ text: extractedText });
    } catch (error) {
        console.error("Extraction error:", error);
        res.status(500).json({ error: "Failed to extract text from file" });
    }
});

module.exports = router;