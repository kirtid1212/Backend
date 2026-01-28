require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fileUpload = require('express-fileupload');
const connectDB = require('./src/utils/database');
require('./src/firebaseAdmin');

const v1Routes = require('./src/routes/v1');
const paypalRoutes = require('./src/routes/paypal.routes');
const paypalWebhook = require('./src/webhooks/paypal.webhook');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

connectDB();

// Configure CORS with proper options for file uploads and preflight requests
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // In production, replace with your actual frontend domain(s)
    const allowedOrigins = [
      'http://localhost:62896',
      'http://localhost:3000',
      'http://127.0.0.1:62896',
      'http://127.0.0.1:3000'
    ];

    // Allow any localhost port for development
   if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed)) || origin.match(/^http:\/\/localhost:\d+$/)) { callback(null, true); } else { callback(new Error('Not allowed by CORS')); }

  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Content-Length',
    'Accept',
    'Authorization',
    'Origin',
    'Cache-Control',
    'X-Requested-With',
    'X-File-Name'
  ],
  exposedHeaders: ['Content-Disposition', 'Content-Length'],
  credentials: true,
  optionsSuccessStatus: 204, // Some legacy browsers choke on 200
  preflightContinue: false, // Don't pass preflight requests to next middleware
  maxAge: 86400 // Cache preflight response for 24 hours
};

app.use(cors(corsOptions));
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

// JSON for normal routes
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/v1', v1Routes);
app.use('/api/paypal', paypalRoutes);

// PayPal webhook (RAW body)
app.post(
  '/api/paypal/webhook',
  express.raw({ type: 'application/json' }),
  paypalWebhook
);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});



app.listen(PORT, () => {
  console.log(`Ecommerce API server running on port ${PORT}`);
  console.log(`Health check: https://backend-ta8c.onrender.com/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});
