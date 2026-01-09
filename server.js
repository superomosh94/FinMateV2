require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const db = require('./config/db');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global variables
app.use((req, res, next) => {
  res.locals.appName = process.env.APP_NAME || 'FinMate';
  res.locals.currentPath = req.path;
  next();
});

// Load routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/super-admin', require('./routes/superAdminRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/team-leader', require('./routes/teamLeaderRoutes'));
app.use('/team-member', require('./routes/teamMemberRoutes'));
app.use('/user', require('./routes/individualUserRoutes'));
app.use('/', require('./routes/indexRoutes'));

// Root route
app.get('/', (req, res) => res.render('index', { title: 'Welcome to FinMate' }));

// Health check
app.get('/health', (req, res) => res.json({
  status: 'OK',
  timestamp: new Date().toISOString(),
  message: 'Server is running correctly'
}));

// 404 fallback
app.use((req, res) => {
  console.warn('404:', req.method, req.url);
  res.status(404).render('404', { title: 'Page Not Found', requestedUrl: req.url });
});

// Port binding
const PORT = process.env.PORT || 3000;

// Log environment
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 DB Host: ${process.env.DB_HOST || 'localhost'}`);

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Attempt DB connection in the background
  try {
    await db.testConnection();
    console.log('✅ Database connection test successful');

    // Only init if explicitly requested or in non-production to avoid timeouts
    if (process.env.INIT_DB === 'true' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      await db.initDatabase();
      console.log('✅ Database initialized');
    }
  } catch (err) {
    console.error('⚠️ Post-startup DB check failed:', err.message);
  }
});

module.exports = app;
