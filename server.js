require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
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
  cookie: { secure: false }
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

// Route loader
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
const authRoutes = loadRoute('./routes/authRoutes', 'Auth');
const superAdminRoutes = loadRoute('./routes/superAdminRoutes', 'Super Admin');
const adminRoutes = loadRoute('./routes/adminRoutes', 'Admin');
const teamLeaderRoutes = loadRoute('./routes/teamLeaderRoutes', 'Team Leader');
const teamMemberRoutes = loadRoute('./routes/teamMemberRoutes', 'Team Member');
const individualUserRoutes = loadRoute('./routes/individualUserRoutes', 'Individual User');
const dashboardRoutes = loadRoute('./routes/dashboardRoutes', 'Dashboard');

// Mount routes
app.use('/auth', authRoutes);
app.use('/super-admin', superAdminRoutes);
app.use('/admin', adminRoutes);
app.use('/team-leader', teamLeaderRoutes);
app.use('/team-member', teamMemberRoutes);
app.use('/user', individualUserRoutes);
app.use('/', dashboardRoutes);

// Routes
app.get('/', (req, res) => res.render('index', { title: 'Welcome to FinMate' }));

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

const PORT = process.env.PORT || 3000;

// Server start
db.getConnection()
  .then(() => {
    console.log('✅ Database connected');
    return db.initDatabase();
  })
  .then(() => {
    console.log('✅ Database initialized');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = app; 