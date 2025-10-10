const User = require('../../models/User');
const db = require('../../config/db');
const { ROLES } = require('../../config/appConfig');

const userController = {
  getUsers: async (req, res) => {
    try {
      const [users] = await db.pool.execute(
        `SELECT u.*, r.name as role_name, t.name as team_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         LEFT JOIN teams t ON u.team_id = t.id 
         WHERE u.is_active = TRUE AND r.name IN ('team_leader', 'team_member', 'individual_user')
         ORDER BY u.created_at DESC`
      );

      const [roles] = await db.pool.execute('SELECT * FROM roles WHERE name IN ("team_leader", "team_member", "individual_user")');
      const [teams] = await db.pool.execute('SELECT * FROM teams');

      res.render('admin/users/index', {
        title: 'Manage Users - FinMate',
        users,
        roles,
        teams,
        user: req.user
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.render('admin/users/index', {
        title: 'Manage Users - FinMate',
        users: [],
        roles: [],
        teams: [],
        user: req.user
      });
    }
  },

  getAddUser: async (req, res) => {
    try {
      const [roles] = await db.pool.execute('SELECT * FROM roles WHERE name IN ("team_leader", "team_member", "individual_user")');
      const [teams] = await db.pool.execute('SELECT * FROM teams');

      res.render('admin/users/add', {
        title: 'Add User - FinMate',
        roles,
        teams,
        user: req.user
      });
    } catch (error) {
      console.error('Get add user error:', error);
      res.redirect('/admin/users');
    }
  },

  postAddUser: async (req, res) => {
    try {
      const { username, email, password, first_name, last_name, role_id, team_id } = req.body;

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        const [roles] = await db.pool.execute('SELECT * FROM roles WHERE name IN ("team_leader", "team_member", "individual_user")');
        const [teams] = await db.pool.execute('SELECT * FROM teams');
        
        return res.render('admin/users/add', {
          title: 'Add User - FinMate',
          roles,
          teams,
          user: req.user,
          error: 'User with this email already exists'
        });
      }

      await User.create({
        username,
        email,
        password,
        first_name,
        last_name,
        role_id,
        team_id: team_id || null
      });

      res.redirect('/admin/users');
    } catch (error) {
      console.error('Add user error:', error);
      const [roles] = await db.pool.execute('SELECT * FROM roles WHERE name IN ("team_leader", "team_member", "individual_user")');
      const [teams] = await db.pool.execute('SELECT * FROM teams');
      
      res.render('admin/users/add', {
        title: 'Add User - FinMate',
        roles,
        teams,
        user: req.user,
        error: 'An error occurred while adding user'
      });
    }
  },

  getEditUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);
      
      if (!user || user.role_name === ROLES.SUPER_ADMIN || user.role_name === ROLES.ADMIN) {
        return res.redirect('/admin/users');
      }

      const [roles] = await db.pool.execute('SELECT * FROM roles WHERE name IN ("team_leader", "team_member", "individual_user")');
      const [teams] = await db.pool.execute('SELECT * FROM teams');

      res.render('admin/users/edit', {
        title: 'Edit User - FinMate',
        user,
        roles,
        teams,
        user: req.user
      });
    } catch (error) {
      console.error('Get edit user error:', error);
      res.redirect('/admin/users');
    }
  },

  postEditUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const { username, email, first_name, last_name, role_id, team_id } = req.body;

      await User.update(userId, {
        username,
        email,
        first_name,
        last_name,
        role_id,
        team_id: team_id || null
      });

      res.redirect('/admin/users');
    } catch (error) {
      console.error('Edit user error:', error);
      res.redirect('/admin/users');
    }
  },

  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      await User.delete(userId);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'User deleted successfully' });
      }
      
      res.redirect('/admin/users');
    } catch (error) {
      console.error('Delete user error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error deleting user' });
      }
      
      res.redirect('/admin/users');
    }
  }
};

module.exports = userController;