# Admin Dashboard - Deployment & Production Guide

## 🏗️ Pre-Deployment Checklist

- [ ] All controllers implemented
- [ ] All routes configured
- [ ] Database models updated
- [ ] Environment variables set
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] JWT tokens secure
- [ ] Logging setup complete
- [ ] Tests written and passing
- [ ] API documentation updated

---

## 🔒 Security Considerations

### 1. **Environment Variables**

Create `.env` file:

```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
DB_NAME=ecommerce_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRY=7d

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=hashed-password

# API
PORT=3000
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 2. **Input Validation**

Add validation middleware:

```javascript
// src/middleware/validation.middleware.js
const { body, validationResult } = require('express-validator');

exports.validateNotification = [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('title').trim().notEmpty().withMessage('Title required'),
  body('message').trim().notEmpty().withMessage('Message required'),
  body('type').isIn(['ORDER_PLACED', 'PAYMENT_SUCCESS', 'DELIVERY_SUCCESS']).withMessage('Invalid type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];
```

### 3. **Rate Limiting**

```javascript
// src/middleware/rateLimit.js (Already exists)
const rateLimit = require('express-rate-limit');

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = adminLimiter;
```

Use in routes:
```javascript
router.use(adminLimiter);
```

### 4. **CORS Configuration**

```javascript
// server.js
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 5. **Helmet Security Headers**

```javascript
// server.js
const helmet = require('helmet');
app.use(helmet());
```

---

## 📝 Logging & Monitoring

### 1. **Winston Logger Setup**

```javascript
// src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'admin-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### 2. **Activity Logging**

```javascript
// src/middleware/activityLog.middleware.js
const ActivityLog = require('../models/ActivityLog');

exports.logActivity = async (req, res, next) => {
  res.on('finish', async () => {
    await ActivityLog.create({
      adminId: req.user?.id,
      action: `${req.method} ${req.path}`,
      status: res.statusCode,
      details: {
        body: req.body,
        query: req.query,
        params: req.params
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    });
  });
  next();
};
```

Use:
```javascript
router.use(exports.logActivity);
```

### 3. **Performance Monitoring**

```javascript
// Monitor response times
const ResponseTime = require('response-time');
app.use(ResponseTime((req, res, time) => {
  if (time > 1000) { // Log slow requests
    logger.warn(`Slow request: ${req.method} ${req.path} took ${time}ms`);
  }
}));
```

---

## 🗄️ Database Optimization

### 1. **Add Indexes**

```javascript
// src/models/Review.js
reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ createdAt: 1 });

// src/models/Notification.js
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// src/models/Order.js
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
```

### 2. **Database Connection Pooling**

```javascript
// src/config/db.js
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true
});
```

### 3. **Query Optimization**

```javascript
// Use lean() for read-only operations
const customers = await User.find({ role: 'user' })
  .lean()
  .select('-password');

// Use projection to fetch only needed fields
const orders = await Order.find()
  .select('orderNumber status totalAmount createdAt -_id')
  .lean();

// Batch operations
const reviewIds = [...];
await Review.updateMany(
  { _id: { $in: reviewIds } },
  { status: 'approved' }
);
```

---

## 🚀 Deployment Options

### Option 1: Heroku Deployment

```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login to Heroku
heroku login

# 3. Create app
heroku create your-app-name

# 4. Add MongoDB (if not already)
heroku addons:create mongolab

# 5. Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production

# 6. Deploy
git push heroku main
```

### Option 2: AWS EC2 Deployment

```bash
# 1. SSH into EC2 instance
ssh -i key.pem ec2-user@your-instance.compute.amazonaws.com

# 2. Install Node.js and npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16

# 3. Clone repository
git clone your-repo-url
cd your-repo

# 4. Install dependencies
npm install --production

# 5. Set up PM2
npm install -g pm2
pm2 start server.js --name "admin-api"
pm2 startup
pm2 save

# 6. Set up Nginx reverse proxy
# See nginx configuration below
```

### Option 3: Docker Deployment

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/ecommerce
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - mongo

  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

---

## 🔌 Nginx Configuration

```nginx
upstream admin_api {
  server localhost:3000;
}

server {
  listen 80;
  server_name your-domain.com;

  # Redirect HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name your-domain.com;

  ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript;

  location / {
    proxy_pass http://admin_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## 📊 Performance Monitoring

### 1. **New Relic Integration**

```javascript
// server.js (top of file)
require('newrelic');

const express = require('express');
// ... rest of code
```

### 2. **Datadog Integration**

```javascript
// src/config/monitoring.js
const StatsD = require('node-dogstatsd').StatsD;

const dogstatsd = new StatsD();

// Track metrics
dogstatsd.gauge('api.response_time', 100);
dogstatsd.increment('api.requests');
```

---

## 🧪 Testing

### 1. **Unit Tests**

```javascript
// tests/analytics.controller.test.js
const request = require('supertest');
const app = require('../server');

describe('Analytics Controller', () => {
  it('should return dashboard summary', async () => {
    const response = await request(app)
      .get('/api/v1/admin/analytics/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

### 2. **Load Testing**

```bash
# Install k6
brew install k6

# Create test script
# tests/load.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  let response = http.get('http://localhost:3000/api/v1/admin/analytics/summary');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
}

# Run test
k6 run tests/load.js
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Heroku
        run: |
          git remote add heroku https://git.heroku.com/${{ secrets.HEROKU_APP }}.git
          git push heroku main
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
```

---

## 📋 Monitoring Checklist

- [ ] Response time < 200ms
- [ ] Error rate < 0.1%
- [ ] CPU usage < 70%
- [ ] Memory usage < 80%
- [ ] Database connection pool healthy
- [ ] No unhandled promise rejections
- [ ] All endpoints returning correct status codes
- [ ] Authentication working correctly
- [ ] Rate limiting in effect
- [ ] Logs being captured

---

## 🆘 Troubleshooting Production Issues

### High Response Time
```javascript
// Check slow queries
db.setProfilingLevel(1);
db.system.profile.find().sort({ ts: -1 }).limit(5);
```

### Memory Leaks
```javascript
// Use clinic.js
npm install -g clinic
clinic doctor -- npm start
```

### Database Connection Issues
```javascript
// Monitor connections
mongoose.connection.on('connected', () => console.log('DB connected'));
mongoose.connection.on('error', (err) => logger.error('DB error', err));
mongoose.connection.on('disconnected', () => logger.warn('DB disconnected'));
```

---

## 📞 Emergency Procedures

### Database Down
1. Alert admin team
2. Switch to backup database
3. Notify customers of potential delays
4. Start database recovery

### API Server Down
1. Check logs for errors
2. Restart server
3. If issue persists, rollback to previous version
4. Investigate root cause

### Security Breach
1. Revoke all admin tokens
2. Force password reset for all admins
3. Enable additional logging
4. Conduct security audit

---

## 📚 Additional Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB Optimization Guide](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Version:** 1.0
**Last Updated:** January 2026
