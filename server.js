const compression = require('compression');
const express = require('express');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

function parseCorsWhitelist(raw) {
  return raw ? raw.split(',').map((origin) => origin.trim()).filter(Boolean) : [];
}

const whitelist = parseCorsWhitelist(process.env.CORS_WHITELIST);
if (whitelist.length === 0) {
  console.warn('CORS whitelist is empty; no origins are allowed');
}

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://web.telegram.org'],
      imgSrc: ["'self'", 'data:', 'https://web.telegram.org'],
      connectSrc: ["'self'", 'https://web.telegram.org', 'wss://web.telegram.org'],
      styleSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    }
  })
);

app.use((err, req, res, next) => {
  if (err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ message: 'CORS: origin not allowed' });
  }
  next(err);
});

const thirdTour = process.argv[2] == 3;
const forcePort = process.argv[3];
const useHttp = process.argv[4] !== 'https';

const publicFolderName = thirdTour ? 'public3' : 'public';
const port = forcePort ? +forcePort : (+process.env.PORT || (thirdTour ? 8443 : 8080));

app.set('etag', false);
app.use((req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  const cacheableExtensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.webp',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.wasm'
  ];
  if (cacheableExtensions.includes(ext)) {
    const filename = path.basename(req.path, ext);
    const hasHash = /[.-][0-9a-f]{8,}$/i.test(filename);
    res.set(
      'Cache-Control',
      hasHash ? 'public, max-age=31536000, immutable' : 'public, max-age=300'
    );
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
});
app.use(compression());

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis client error', err);
});

redisClient.connect().catch((err) => {
  console.error('Redis connection error:', err);
});

app.use(
  rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args)
    }),
    windowMs: 15 * 60 * 1000,
    max: 100
  })
);
app.use(express.json({ limit: '1mb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  next(err);
});
app.use(express.static(publicFolderName));

app.get('/', (req, res) => {
  res.sendFile(__dirname + `/${publicFolderName}/index.html`);
});

const server = useHttp ? http : https;

const keyPath = path.join(__dirname, 'certs', 'server-key.pem');
const certPath = path.join(__dirname, 'certs', 'server-cert.pem');

let options = {};
if (!useHttp) {
  if (!fs.existsSync(keyPath)) {
    console.error('HTTPS key file not found:', keyPath);
    process.exit(1);
  }
  if (!fs.existsSync(certPath)) {
    console.error('HTTPS certificate file not found:', certPath);
    process.exit(1);
  }
  try {
    options.key = fs.readFileSync(keyPath);
    options.cert = fs.readFileSync(certPath);
  } catch (err) {
    console.error('Failed to load HTTPS credentials:', err.message);
    process.exit(1);
  }
}

const httpServer = server.createServer(options, app);

if (!useHttp) {
  const reloadCert = () => {
    try {
      const newKey = fs.readFileSync(keyPath);
      const newCert = fs.readFileSync(certPath);
      httpServer.setSecureContext({ key: newKey, cert: newCert });
      console.log('TLS certificate reloaded');
    } catch (err) {
      console.error('Failed to reload HTTPS certificate:', err.message);
    }
  };

  fs.watch(keyPath, reloadCert);
  fs.watch(certPath, reloadCert);
}

httpServer.listen(port, () => {
  console.log('Listening port:', port, 'folder:', publicFolderName);
});
