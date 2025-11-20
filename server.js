const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
let nanoid;
const QRCode = require('qrcode');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Trust proxy when running behind a load-balancer (set via env when appropriate)
app.set('trust proxy', process.env.TRUST_PROXY === 'true' || true);

// Helmet - add CSP including frame-ancestors (allow Office embedding)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", 'data:'],
            frameAncestors: ["'self'", 'https://*.office.com', 'https://*.officeapps.live.com', 'https://*.microsoft.com']
        }
    },
    frameguard: false
}));

// Logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Compression
app.use(compression());

// CORS: restrict if ALLOWED_ORIGIN is set (comma-separated list), otherwise allow same-origin
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors({ origin: allowedOrigin ? allowedOrigin.split(',') : true }));

// Body parser with sensible default limits
app.use(express.json({ limit: process.env.JSON_LIMIT || '10kb' }));

const PORT = process.env.PORT || 3000;

// In-memory sessions store
// sessions[code] = { count: number, presses: [{ts, ip}], createdAt, lastActive }
const sessions = Object.create(null);
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS) || 12 * 60 * 60 * 1000; // 12 hours

// track the current (latest) lecturer session so widgets can auto-join
let currentSession = null;

// Rate limiters
const createSessionLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
const pressLimiter = rateLimit({ windowMs: 10 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

function createSession() {
    const code = nanoid(6).toUpperCase();
    const now = Date.now();
    sessions[code] = { count: 0, presses: [], createdAt: now, lastActive: now };
    // set as current session by default
    currentSession = code;
    // schedule cleanup
    setTimeout(() => {
        if (sessions[code] && Date.now() - sessions[code].lastActive >= SESSION_TTL_MS) {
            delete sessions[code];
        }
    }, SESSION_TTL_MS + 1000);
    return code;
}

function getBaseUrl(req) {
    return req.protocol + '://' + req.get('host');
}

// Create a new session (lecturer)
app.post('/api/session', createSessionLimiter, async (req, res) => {
    const code = createSession();
    const base = getBaseUrl(req);
    const joinUrl = `${base}/join?code=${code}`;
    try {
        const qrDataUrl = await QRCode.toDataURL(joinUrl);
        res.json({ code, joinUrl, qrDataUrl });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate QR' });
    }
});

// Return the current session code (if any)
app.get('/api/session/current', (req, res) => {
    if (!currentSession || !sessions[currentSession]) return res.status(404).json({ error: 'No current session' });
    res.json({ code: currentSession });
});

// Reset the current session (useful for content add-ins that reset on load)
app.post('/api/session/current/reset', (req, res) => {
    if (!currentSession || !sessions[currentSession]) return res.status(404).json({ error: 'No current session' });
    const s = sessions[currentSession];
    s.count = 0; s.presses = []; s.lastActive = Date.now();
    io.to(currentSession).emit('update', { count: s.count });
    res.json({ ok: true });
});

// Get session info
app.get('/api/session/:code', (req, res) => {
    const code = (req.params.code || '').toUpperCase();
    const s = sessions[code];
    if (!s) return res.status(404).json({ error: 'Session not found' });
    res.json({ code, count: s.count, createdAt: s.createdAt });
});

// Student presses the button
app.post('/api/press', pressLimiter, (req, res) => {
    const code = ((req.body && req.body.code) || '').toUpperCase();
    if (!code || !sessions[code]) return res.status(404).json({ error: 'Session not found' });
    const s = sessions[code];
    s.count += 1;
    s.presses.push({ ts: Date.now(), ip: req.ip });
    s.lastActive = Date.now();
    io.to(code).emit('update', { count: s.count });
    res.json({ ok: true, count: s.count });
});

// Reset session count
app.post('/api/reset', (req, res) => {
    const code = ((req.body && req.body.code) || '').toUpperCase();
    if (!code || !sessions[code]) return res.status(404).json({ error: 'Session not found' });
    const s = sessions[code];
    s.count = 0;
    s.presses = [];
    s.lastActive = Date.now();
    io.to(code).emit('update', { count: s.count });
    res.json({ ok: true });
});

// Serve join and host pages
// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Friendly routes: serve the HTML pages for extensionless paths
app.get(['/', '/host'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'host.html'));
});
app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student.html'));
});
app.get('/join', (req, res) => {
    // /join?code=ABC will be handled client-side by student.html
    res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

// Socket.IO: hosts and optionally students can join room for real-time updates
io.on('connection', (socket) => {
    socket.on('join', (code) => {
        code = (code || '').toUpperCase();
        if (!code || !sessions[code]) return;
        socket.join(code);
        socket.emit('update', { count: sessions[code].count });
    });
});

// Health check
app.get('/health', (req, res) => res.status(200).json({ ok: true }));

(async function start() {
    try {
        const m = await import('nanoid');
        nanoid = m.nanoid;
        server.listen(PORT, () => {
            console.log(`Confusion Radar running on http://localhost:${PORT} (env=${process.env.NODE_ENV || 'development'})`);
        });
    } catch (err) {
        console.error('Failed to initialize nanoid:', err);
        process.exit(1);
    }
})();
