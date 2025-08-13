const compression = require('compression');
const express = require('express');
const rateLimit = require('express-rate-limit');
const https = require('https');
const http = require('http');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

const whitelist = process.env.CORS_WHITELIST
  ? process.env.CORS_WHITELIST.split(',').map((origin) => origin.trim())
  : [
      'https://web.telegram.org',
      'https://t.me'
    ];

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
  if(req.path.endsWith('.svg')) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
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
  options.key = fs.readFileSync(__dirname + '/certs/server-key.pem');
  options.cert = fs.readFileSync(__dirname + '/certs/server-cert.pem');
}

server.createServer(options, app).listen(port, () => {
  console.log('Listening port:', port, 'folder:', publicFolderName);
});
