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

// Route loader helper
const loadRoute = (routePath, routeName) => {
  try {
    delete require.cache[require.resolve(routePath)];
    const route = require(routePath);
    console.log(`✅ ${routeName} loaded`);
    return route;
  } catch (error) {
    console.error(`❌ Failed to load ${routeName}:`, error.message);
    const express = require('express');
    const fallback = express.Router();
    fallback.get('*', (req, res) => res.status(500).json({ 
      error: `Route ${routeName} failed`, 
      message: error.message 
    }));
    return fallback;
  }
};

// Load routes
app.use('/auth', loadRoute('./routes/authRoutes', 'Auth'));
app.use('/super-admin', loadRoute('./routes/superAdminRoutes', 'Super Admin'));
app.use('/admin', loadRoute('./routes/adminRoutes', 'Admin'));
app.use('/team-leader', loadRoute('./routes/teamLeaderRoutes', 'Team Leader'));
app.use('/team-member', loadRoute('./routes/teamMemberRoutes', 'Team Member'));
app.use('/user', loadRoute('./routes/individualUserRoutes', 'Individual User'));
app.use('/', loadRoute('./routes/dashboardRoutes', 'Dashboard'));

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

// Start server after DB connection
(async () => {
  try {
    // For Aiven SSL: load CA if provided
    if (process.env.DB_CA_PATH && fs.existsSync(process.env.DB_CA_PATH)) {
      process.env.DB_SSL_CA = fs.readFileSync(process.env.DB_CA_PATH, 'utf8');
    }

    await db.getConnection();
    console.log('✅ Database connected');
    await db.initDatabase();
    console.log('✅ Database initialized');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
})();

module.exports = app;
