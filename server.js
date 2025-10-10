require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// Database connection
const db = require('./config/db');

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global variables
app.use((req, res, next) => {
  res.locals.appName = process.env.APP_NAME;
  res.locals.currentPath = req.path;
  next();
});

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/super-admin', require('./routes/superAdminRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/team-leader', require('./routes/teamLeaderRoutes'));
app.use('/team-member', require('./routes/teamMemberRoutes'));
app.use('/user', require('./routes/individualUserRoutes'));

// Home route
app.get('/', (req, res) => {
  res.render('index', { title: 'Welcome to FinMate' });
});

// Error handling middleware
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

// 404 handler - fallback
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

const PORT = process.env.PORT || 3000;

// Test database connection and start server
db.getConnection()
  .then(() => {
    console.log('✅ Database connected successfully');
    
    // Initialize database tables
    db.initDatabase().then(() => {
      console.log('✅ Database tables initialized');
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 App URL: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

module.exports = app;