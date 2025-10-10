// controllers/teamMember/profileController.js
const db = require('../../config/db');

const profileController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user details with team information
      const [user] = await db.execute(
        `SELECT u.*, t.name as team_name, t.description as team_description, 
                tl.first_name as team_leader_first_name, tl.last_name as team_leader_last_name
         FROM users u 
         LEFT JOIN teams t ON u.team_id = t.id 
         LEFT JOIN users tl ON t.team_leader_id = tl.id 
         WHERE u.id = ?`,
        [userId]
      );

      if (user.length === 0) {
        return res.status(404).render('teamMember/error', {
          title: 'Profile Not Found - FinMate',
          user: req.user,
          error: { message: 'User profile not found', status: 404 }
        });
      }

      // Get user statistics
      const [stats] = await db.execute(
        `SELECT 
          COUNT(*) as total_expenses,
          SUM(amount) as total_spent,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_expenses,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_expenses
         FROM expenses 
         WHERE user_id = ? AND deleted_at IS NULL`,
        [userId]
      );

      const userProfile = user[0];
      const userStats = stats[0];

      res.render('teamMember/profile/view', {
        title: 'My Profile - FinMate',
        user: req.user,
        profile: userProfile,
        stats: userStats,
        success: req.query.success
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).render('teamMember/error', {
        title: 'Error - FinMate',
        user: req.user,
        error: { message: 'Failed to load profile', status: 500 }
      });
    }
  },

  // Get edit profile form
  getEditProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const [user] = await db.execute(
        'SELECT id, first_name, last_name, email, phone, address FROM users WHERE id = ?',
        [userId]
      );

      if (user.length === 0) {
        return res.redirect('/team-member/profile');
      }

      res.render('teamMember/profile/edit', {
        title: 'Edit Profile - FinMate',
        user: req.user,
        profile: user[0],
        errors: req.session.errors,
        oldInput: req.session.oldInput
      });

      // Clear session data after rendering
      delete req.session.errors;
      delete req.session.oldInput;
    } catch (error) {
      console.error('Edit profile form error:', error);
      res.status(500).render('teamMember/error', {
        title: 'Error - FinMate',
        user: req.user,
        error: { message: 'Failed to load edit profile form', status: 500 }
      });
    }
  },

  // Update profile
  postEditProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { first_name, last_name, phone, address } = req.body;

      // Basic validation
      const errors = [];
      if (!first_name?.trim()) errors.push('First name is required');
      if (!last_name?.trim()) errors.push('Last name is required');
      if (phone && phone.length > 20) errors.push('Phone number is too long');
      if (address && address.length > 255) errors.push('Address is too long');

      if (errors.length > 0) {
        req.session.errors = errors;
        req.session.oldInput = req.body;
        return res.redirect('/team-member/profile/edit');
      }

      // Update profile
      await db.execute(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?, updated_at = NOW() WHERE id = ?',
        [first_name.trim(), last_name.trim(), phone?.trim(), address?.trim(), userId]
      );

      // Update session user data
      req.user.first_name = first_name.trim();
      req.user.last_name = last_name.trim();
      req.user.phone = phone?.trim();
      req.user.address = address?.trim();

      res.redirect('/team-member/profile?success=Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      req.session.errors = ['Failed to update profile. Please try again.'];
      req.session.oldInput = req.body;
      res.redirect('/team-member/profile/edit');
    }
  },

  // Get settings page
  getSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user notification preferences
      const [preferences] = await db.execute(
        `SELECT 
          email_notifications,
          push_notifications,
          monthly_report,
          expense_reminders,
          budget_alerts
         FROM user_preferences 
         WHERE user_id = ?`,
        [userId]
      );

      const userPreferences = preferences.length > 0 ? preferences[0] : {
        email_notifications: true,
        push_notifications: true,
        monthly_report: true,
        expense_reminders: true,
        budget_alerts: true
      };

      res.render('teamMember/profile/settings', {
        title: 'Settings - FinMate',
        user: req.user,
        preferences: userPreferences,
        success: req.query.success,
        errors: req.session.errors
      });

      delete req.session.errors;
    } catch (error) {
      console.error('Settings fetch error:', error);
      res.status(500).render('teamMember/error', {
        title: 'Error - FinMate',
        user: req.user,
        error: { message: 'Failed to load settings', status: 500 }
      });
    }
  },

  // Update settings
  updateSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        email_notifications, 
        push_notifications, 
        monthly_report, 
        expense_reminders, 
        budget_alerts 
      } = req.body;

      // Convert checkbox values to boolean
      const settings = {
        email_notifications: email_notifications === 'on',
        push_notifications: push_notifications === 'on',
        monthly_report: monthly_report === 'on',
        expense_reminders: expense_reminders === 'on',
        budget_alerts: budget_alerts === 'on'
      };

      // Check if preferences exist
      const [existing] = await db.execute(
        'SELECT id FROM user_preferences WHERE user_id = ?',
        [userId]
      );

      if (existing.length > 0) {
        // Update existing preferences
        await db.execute(
          `UPDATE user_preferences 
           SET email_notifications = ?, push_notifications = ?, monthly_report = ?, 
               expense_reminders = ?, budget_alerts = ?, updated_at = NOW() 
           WHERE user_id = ?`,
          [
            settings.email_notifications,
            settings.push_notifications,
            settings.monthly_report,
            settings.expense_reminders,
            settings.budget_alerts,
            userId
          ]
        );
      } else {
        // Insert new preferences
        await db.execute(
          `INSERT INTO user_preferences 
           (user_id, email_notifications, push_notifications, monthly_report, expense_reminders, budget_alerts) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            settings.email_notifications,
            settings.push_notifications,
            settings.monthly_report,
            settings.expense_reminders,
            settings.budget_alerts
          ]
        );
      }

      res.redirect('/team-member/settings?success=Settings updated successfully');
    } catch (error) {
      console.error('Settings update error:', error);
      req.session.errors = ['Failed to update settings. Please try again.'];
      res.redirect('/team-member/settings');
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { current_password, new_password, confirm_password } = req.body;

      // Validation
      const errors = [];
      if (!current_password) errors.push('Current password is required');
      if (!new_password) errors.push('New password is required');
      if (new_password !== confirm_password) errors.push('New passwords do not match');
      if (new_password.length < 6) errors.push('New password must be at least 6 characters long');

      if (errors.length > 0) {
        req.session.errors = errors;
        return res.redirect('/team-member/settings');
      }

      // Get current password hash
      const [user] = await db.execute(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );

      if (user.length === 0) {
        req.session.errors = ['User not found'];
        return res.redirect('/team-member/settings');
      }

      // Verify current password (you'll need to use your auth system's password verification)
      const bcrypt = require('bcrypt');
      const isCurrentPasswordValid = await bcrypt.compare(current_password, user[0].password);

      if (!isCurrentPasswordValid) {
        req.session.errors = ['Current password is incorrect'];
        return res.redirect('/team-member/settings');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);

      // Update password
      await db.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, userId]
      );

      res.redirect('/team-member/settings?success=Password changed successfully');
    } catch (error) {
      console.error('Password change error:', error);
      req.session.errors = ['Failed to change password. Please try again.'];
      res.redirect('/team-member/settings');
    }
  }
};

module.exports = profileController;