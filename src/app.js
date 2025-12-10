require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const hpp = require('hpp');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController')
const authRouter = require('./routes/authRouter')
const paymentRouter = require('./routes/paymentRoutes')
const webhookRouter = require('./routes/webhookRoutes');
 
const app = express();

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined')); // production logs
}

app.use(
  '/api/v1/webhook', 
  express.raw({ type: 'application/json' }), 
  webhookRouter
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '5kb' }));

// Security HTTP headers
app.use(helmet());

// CORS 
app.use(cors({
  origin: process.env.FRONTEND_URL, // TODO: replace * with your React domain in production
  credentials: true
}));

// Prevent parameter pollution
app.use(hpp());

// Rate limiting (100 requests per 15 min per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);


// 1) ROUTES
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/payment', paymentRouter);

// 2) UNHANDLED ROUTES
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3) GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;