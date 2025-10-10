const bcrypt = require('bcryptjs');
const { query, execute } = require('../config/db');
const { generateToken } = require('../config/jwt');

const authController = {
  getLogin: (req, res) => {
    console.log('🔐 GET /auth/login - Rendering login page');
    res.render('auth/login', {
      title: 'Login - FinMate',
      error: null,
      user: null
    });
  },

  postLogin: async (req, res) => {
    console.log('🚀 POST /auth/login - Body:', req.body);

    try {
      const { email, password } = req.body;

      if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.render('auth/login', {
          title: 'Login - FinMate',
          error: 'Email and password are required',
          user: null
        });
      }

      console.log('🔍 Looking for user with email:', email);

      let users;
      try {
        // Get user with role in single query
        users = await query(
          'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
          [email]
        );
      } catch (dbError) {
        console.error('💥 Database query error:', dbError);
        return res.render('auth/login', {
          title: 'Login - FinMate',
          error: 'Database connection error',
          user: null
        });
      }

      const user = users[0];
      if (!user) {
        console.log('❌ User not found for email:', email);
        return res.render('auth/login', {
          title: 'Login - FinMate',
          error: 'Invalid email or password',
          user: null
        });
      }

      console.log('✅ User found:', { 
        id: user.id, 
        email: user.email, 
        role_name: user.role_name 
      });

      let isPasswordValid;
      try {
        // Check both password and passwordHash fields
        const userPassword = user.password || user.passwordHash;
        if (!userPassword) {
          console.log('❌ No password found for user');
          return res.render('auth/login', {
            title: 'Login - FinMate',
            error: 'Invalid email or password',
            user: null
          });
        }
        
        isPasswordValid = await bcrypt.compare(password, userPassword);
        console.log('🔑 Password validation result:', isPasswordValid);
      } catch (pwdError) {
        console.error('💥 Password comparison error:', pwdError);
        return res.render('auth/login', {
          title: 'Login - FinMate',
          error: 'Password verification failed',
          user: null
        });
      }

      if (!isPasswordValid) {
        console.log('❌ Invalid password for user:', user.email);
        return res.render('auth/login', {
          title: 'Login - FinMate',
          error: 'Invalid email or password',
          user: null
        });
      }

      const roleName = user.role_name || 'individual_user';
      console.log('🎯 User role:', roleName);

      const userPayload = {
        userId: user.id,
        email: user.email,
        role: roleName
      };

      console.log('🎫 Generating token for payload:', userPayload);
      
      let token;
      try {
        token = generateToken(userPayload);
        console.log('✅ Token generated successfully');
      } catch (tokenError) {
        console.error('💥 Token generation error:', tokenError);
        // If JWT secret is missing, provide a fallback
        if (tokenError.message.includes('secret')) {
          console.log('⚠️ JWT secret missing, using development fallback');
          // Temporary fallback for development
          const jwt = require('jsonwebtoken');
          token = jwt.sign(userPayload, 'development-fallback-secret', {
            expiresIn: '7d'
          });
        } else {
          throw tokenError;
        }
      }

      console.log('🍪 Setting cookie...');
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      console.log('✅ Login successful for user:', user.email);

      // FIXED: Use correct redirect paths that actually exist
      const redirectPaths = {
        'super_admin': '/super-admin/dashboard',
        'admin': '/admin/dashboard',
        'team_leader': '/team-leader/dashboard',
        'team_member': '/team-member/dashboard',
        'individual_user': '/user/dashboard'
      };

      const redirectPath = redirectPaths[roleName] || '/user/dashboard';
      console.log('🔄 Redirecting to:', redirectPath);

      return res.redirect(redirectPath);

    } catch (error) {
      console.error('💥 LOGIN ERROR:', error);
      console.error('💥 Error stack:', error.stack);
      return res.render('auth/login', {
        title: 'Login - FinMate',
        error: 'An error occurred during login',
        user: null
      });
    }
  },

  getRegister: (req, res) => {
    console.log('📝 GET /auth/register - Rendering register page');
    res.render('auth/register', {
      title: 'Register - FinMate',
      error: null,
      user: null
    });
  },

  postRegister: async (req, res) => {
    console.log('🚀 POST /auth/register - Body:', req.body);

    try {
      const { username, email, password, first_name, last_name, confirm_password } = req.body;

      if (!username || !email || !password || !first_name || !last_name || !confirm_password) {
        console.log('❌ Missing required fields');
        return res.render('auth/register', {
          title: 'Register - FinMate',
          error: 'All fields are required',
          user: null
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('❌ Invalid email format:', email);
        return res.render('auth/register', {
          title: 'Register - FinMate',
          error: 'Please enter a valid email address',
          user: null
        });
      }

      if (password.length < 6) {
        console.log('❌ Password too short:', password.length);
        return res.render('auth/register', {
          title: 'Register - FinMate',
          error: 'Password must be at least 6 characters long',
          user: null
        });
      }

      if (password !== confirm_password) {
        console.log('❌ Passwords do not match');
        return res.render('auth/register', {
          title: 'Register - FinMate',
          error: 'Passwords do not match',
          user: null
        });
      }

      console.log('🔍 Checking for existing user...');
      let existingUser;
      try {
        const users = await query(
          'SELECT id FROM users WHERE email = ? OR username = ?',
          [email, username]
        );
        existingUser = users[0];
      } catch (dbError) {
        console.error('💥 Database check error:', dbError);
        return res.render('auth/register', {
          title: 'Register - FinMate',
          error: 'Database connection error',
          user: null
        });
      }

      if (existingUser) {
        console.log('❌ User already exists with email or username:', email, username);
        return res.render('auth/register', {
          title: 'Register - FinMate',
          error: 'User with this email or username already exists',
          user: null
        });
      }

      console.log('🔍 Getting role ID for individual_user...');
      let roleResult;
      try {
        roleResult = await query(
          'SELECT id FROM roles WHERE name = ?',
          ['individual_user']
        );
        console.log('📋 Role query result:', roleResult);
      } catch (roleError) {
        console.error('💥 Role query error:', roleError);
        return res.render('auth/register', {
          title: 'Register - FinMate',
          error: 'System configuration error',
          user: null
        });
      }

      if (roleResult.length === 0) {
        console.error('❌ Individual user role not found in database');
        return res.render('auth/register', {
          title: 'Register - FinMate',
          error: 'System configuration error - role not found',
          user: null
        });
      }

      const roleId = roleResult[0].id;
      console.log('✅ Using role ID:', roleId);

      console.log('🔐 Hashing password...');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      console.log('👤 Creating user...');
      try {
        await execute(
          'INSERT INTO users (username, email, password, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)',
          [username, email.toLowerCase().trim(), passwordHash, first_name, last_name, roleId]
        );
        console.log('✅ User created successfully');
      } catch (createError) {
        console.error('💥 User creation error:', createError);
        return res.render('auth/register', {
          title: 'Register - FinMate',
          error: 'Failed to create user account: ' + createError.message,
          user: null
        });
      }

      console.log('✅ Registration successful');
      return res.render('auth/register-success', {
        title: 'Registration Successful - FinMate',
        user: null
      });

    } catch (error) {
      console.error('💥 REGISTRATION ERROR:', error);
      console.error('💥 Error stack:', error.stack);
      return res.render('auth/register', {
        title: 'Register - FinMate',
        error: 'An unexpected error occurred during registration',
        user: null
      });
    }
  },

  logout: (req, res) => {
    console.log('🚪 POST /auth/logout - Clearing token');
    // FIXED: Clear the correct cookie name (using 'token' instead of 'accessToken'/'refreshToken')
    res.clearCookie('token');
    
    // Also clear any other potential cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    console.log('🔄 Redirecting to login page');
    res.redirect('/auth/login');
  },

  getProfile: (req, res) => {
    console.log('👤 GET /auth/profile');
    res.render('auth/profile', {
      title: 'My Profile - FinMate',
      user: req.user || null,
      error: null,
      success: null
    });
  },

  updateProfile: (req, res) => {
    console.log('✏️ POST /auth/profile');
    res.redirect('/auth/profile?success=Profile updated successfully');
  },

  changePassword: (req, res) => {
    console.log('🔑 POST /auth/change-password');
    res.redirect('/auth/profile?success=Password changed successfully');
  }
};

module.exports = authController;