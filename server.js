const compression = require('compression');
const express = require('express');
const rateLimit = require('express-rate-limit');
const https = require('https');
const http = require('http');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

const whitelist = [
  'https://web.telegram.org',
  'https://t.me'
];

app.use(helmet());
app.use((req, res, next) => {
  res.locals.styleNonce = crypto.randomBytes(16).toString('base64');
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://web.telegram.org'],
      imgSrc: ["'self'", 'data:', 'https://web.telegram.org'],
      connectSrc: ["'self'", 'https://web.telegram.org', 'wss://web.telegram.org'],
      styleSrc: ["'self'", `'nonce-` + res.locals.styleNonce + `'`],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  })(req, res, next);
});
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
  })
);

const thirdTour = process.argv[2] == 3;
const forcePort = process.argv[3];
const useHttp = process.argv[4] !== 'https';

const publicFolderName = thirdTour ? 'public3' : 'public';
const port = forcePort ? +forcePort : (+process.env.PORT || (thirdTour ? 8443 : 8080));

app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(compression());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  fs.readFile(__dirname + `/${publicFolderName}/index.html`, 'utf8', (err, data) => {
    if(err) {
      res.status(500).send('Error');
      return;
    }
    res.send(data.replace(/__STYLE_NONCE__/g, res.locals.styleNonce));
  });
});

app.use(express.static(publicFolderName));

const server = useHttp ? http : https;

let options = {};
if(!useHttp) {
  options.key = fs.readFileSync(__dirname + '/certs/server-key.pem');
  options.cert = fs.readFileSync(__dirname + '/certs/server-cert.pem');
}

if(require.main === module) {
  server.createServer(options, app).listen(port, () => {
    console.log('Listening port:', port, 'folder:', publicFolderName);
  });
}

module.exports = app;
