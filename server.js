const compression = require('compression');
const express = require('express');
const rateLimit = require('express-rate-limit');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { validateCors } = require('./src/config/validateCors');

const app = express();

const whitelist = validateCors(process.env.CORS_WHITELIST);
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
  cors((req, callback) => {
    const origin = req.header('Origin');
    if (!origin || whitelist.includes(origin)) {
      return callback(null, { origin: true });
    }
    console.warn('Blocked CORS origin:', origin, 'IP:', req.ip);
    return callback(new Error('Origin not allowed by CORS'));
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
  const cacheableExtensions = ['.js', '.css', '.png', '.jpg'];
  if (cacheableExtensions.includes(ext)) {
    const filename = path.basename(req.path, ext);
    const hasHash = /[.-][0-9a-f]{8,}$/i.test(filename);
    res.set(
      'Cache-Control',
      hasHash ? 'public, max-age=31536000, immutable' : 'no-store'
    );
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
});
app.use(compression());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(publicFolderName));

app.get('/', (req, res) => {
  res.sendFile(__dirname + `/${publicFolderName}/index.html`);
});

const server = useHttp ? http : https;

let options = {};
if(!useHttp) {
  try {
    options.key = fs.readFileSync(path.join(__dirname, 'certs', 'server-key.pem'));
  } catch (err) {
    console.error('Failed to load HTTPS key:', err.message);
    process.exit(1);
  }
  try {
    options.cert = fs.readFileSync(path.join(__dirname, 'certs', 'server-cert.pem'));
  } catch (err) {
    console.error('Failed to load HTTPS certificate:', err.message);
    process.exit(1);
  }
}

server.createServer(options, app).listen(port, () => {
  console.log('Listening port:', port, 'folder:', publicFolderName);
});
