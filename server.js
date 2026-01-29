require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fileUpload = require('express-fileupload');
const connectDB = require('./src/utils/database');
const { generateHash } = require("./payu");
const { authenticate } = require('./src/middleware/auth.middleware');
require('./src/firebaseAdmin');

const v1Routes = require('./src/routes/v1');
const paypalRoutes = require('./src/routes/paypal.routes');
const paypalWebhook = require('./src/webhooks/paypal.webhook');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

connectDB();

// Configure CORS with proper options for file uploads and preflight requests
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', cors());

// PayPal webhook (RAW body) - MUST be before express.json()
app.post(
  '/api/paypal/webhook',
  express.raw({ type: 'application/json' }),
  paypalWebhook
);

app.post("/generate-hash", generateHash);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    useTempFiles: false,
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true
  })
);
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/v1', v1Routes);
app.use('/api/paypal', paypalRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON:', err.message);
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      message: 'Request body contains malformed JSON'
    });
  }
  console.error(err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});



const server = app.listen(PORT, () => {
  console.log(`Ecommerce API server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});
