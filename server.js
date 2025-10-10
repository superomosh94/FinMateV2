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
  secret: process.env.JWT_SECRET || 'fallback-secret-key',
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
  res.locals.appName = process.env.APP_NAME || 'FinMate';
  res.locals.currentPath = req.path;
  next();
});

console.log('🔄 Loading routes...');

// Enhanced route loading with detailed debugging
const loadRoute = (routePath, routeName) => {
  try {
    console.log(`\n🔍 Loading: ${routeName} from ${routePath}`);
    
    // Clear the require cache to ensure fresh load
    delete require.cache[require.resolve(routePath)];
    
    const route = require(routePath);
    
    console.log(`📦 ${routeName} - Type: ${typeof route}`);
    console.log(`📦 ${routeName} - Is function: ${typeof route === 'function'}`);
    console.log(`📦 ${routeName} - Constructor: ${route?.constructor?.name}`);
    
    if (typeof route !== 'function') {
      console.error(`❌ ${routeName} is NOT a function!`);
      console.error(`❌ Actual value:`, JSON.stringify(route, null, 2).substring(0, 200));
      throw new Error(`Route must export a router function but got ${typeof route}`);
    }
    
    console.log(`✅ ${routeName} loaded successfully as function`);
    return route;
    
  } catch (error) {
    console.error(`💥 CRITICAL ERROR loading ${routeName}:`, error.message);
    console.error(error.stack);
    
    // Create emergency router
    const express = require('express');
    const emergencyRouter = express.Router();
    emergencyRouter.get('*', (req, res) => {
      res.status(500).json({
        error: 'Route loading failed',
        route: routeName,
        message: error.message
      });
    });
    return emergencyRouter;
  }
};

// Load and validate each route individually
console.log('\n=== LOADING INDIVIDUAL ROUTES ===');

const authRoutes = loadRoute('./routes/authRoutes', 'Auth Routes');
const superAdminRoutes = loadRoute('./routes/superAdminRoutes', 'Super Admin Routes');
const adminRoutes = loadRoute('./routes/adminRoutes', 'Admin Routes');
const teamLeaderRoutes = loadRoute('./routes/teamLeaderRoutes', 'Team Leader Routes');
const teamMemberRoutes = loadRoute('./routes/teamMemberRoutes', 'Team Member Routes');
const individualUserRoutes = loadRoute('./routes/individualUserRoutes', 'Individual User Routes');

console.log('\n=== MOUNTING ROUTES ===');

// Mount routes with try-catch for each one
try {
  console.log('🔄 Mounting /auth');
  app.use('/auth', authRoutes);
  console.log('✅ /auth mounted');
} catch (error) {
  console.error('❌ Failed to mount /auth:', error.message);
}

try {
  console.log('🔄 Mounting /super-admin');
  app.use('/super-admin', superAdminRoutes);
  console.log('✅ /super-admin mounted');
} catch (error) {
  console.error('❌ Failed to mount /super-admin:', error.message);
}

try {
  console.log('🔄 Mounting /admin');
  app.use('/admin', adminRoutes);
  console.log('✅ /admin mounted');
} catch (error) {
  console.error('❌ Failed to mount /admin:', error.message);
}

try {
  console.log('🔄 Mounting /team-leader');
  app.use('/team-leader', teamLeaderRoutes);
  console.log('✅ /team-leader mounted');
} catch (error) {
  console.error('❌ Failed to mount /team-leader:', error.message);
}

try {
  console.log('🔄 Mounting /team-member');
  app.use('/team-member', teamMemberRoutes);
  console.log('✅ /team-member mounted');
} catch (error) {
  console.error('❌ Failed to mount /team-member:', error.message);
}

try {
  console.log('🔄 Mounting /user');
  app.use('/user', individualUserRoutes);
  console.log('✅ /user mounted');
} catch (error) {
  console.error('❌ Failed to mount /user:', error.message);
  // Create emergency user routes
  const express = require('express');
  const emergencyUserRouter = express.Router();
  emergencyUserRouter.get('*', (req, res) => {
    res.json({ message: 'User routes - emergency fallback' });
  });
  app.use('/user', emergencyUserRouter);
  console.log('✅ Emergency /user routes mounted');
}

console.log('\n=== ALL ROUTES MOUNTED ===');

// Home route
app.get('/', (req, res) => {
  res.render('index', { title: 'Welcome to FinMate' });
});

// Test route to verify server is working
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running correctly'
  });
});

// Error handling middleware
try {
  const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
  app.use(notFound);
  app.use(errorHandler);
} catch (error) {
  console.error('Error middleware failed:', error.message);
}

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
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

module.exports = app;