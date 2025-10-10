// controllers/teamMember/notificationController.js
const db = require('../../config/db');

const notificationController = {
  // Get all notifications for user
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const type = req.query.type || 'all';
      const offset = (page - 1) * limit;

      // Build query based on filters
      let query = `
        SELECT n.*, 
               u.first_name as sender_first_name, 
               u.last_name as sender_last_name
        FROM notifications n 
        LEFT JOIN users u ON n.sender_id = u.id 
        WHERE n.user_id = ? 
      `;
      const queryParams = [userId];

      if (type === 'unread') {
        query += ' AND n.is_read = false';
      } else if (type === 'read') {
        query += ' AND n.is_read = true';
      }

      query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);

      const [notifications] = await db.execute(query, queryParams);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
      const countParams = [userId];

      if (type === 'unread') {
        countQuery += ' AND is_read = false';
      } else if (type === 'read') {
        countQuery += ' AND is_read = true';
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      // Get unread count for badge
      const [unreadCountResult] = await db.execute(
        'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = false',
        [userId]
      );

      const unreadCount = unreadCountResult[0].unread_count;

      res.render('teamMember/notifications/list', {
        title: 'Notifications - FinMate',
        user: req.user,
        notifications,
        pagination: {
          current: page,
          total: totalPages,
          limit,
          totalItems: total
        },
        filters: {
          type,
          limit
        },
        unreadCount,
        success: req.query.success
      });
    } catch (error) {
      console.error('Notifications fetch error:', error);
      res.status(500).render('teamMember/error', {
        title: 'Error - FinMate',
        user: req.user,
        error: { message: 'Failed to load notifications', status: 500 }
      });
    }
  },

  // Get unread notification count (for API)
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;

      const [result] = await db.execute(
        'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = false',
        [userId]
      );

      res.json({
        success: true,
        unreadCount: result[0].unread_count
      });
    } catch (error) {
      console.error('Unread count error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get unread count'
      });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      // Verify notification belongs to user
      const [notification] = await db.execute(
        'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );

      if (notification.length === 0) {
        if (req.accepts('json')) {
          return res.status(404).json({
            success: false,
            error: 'Notification not found'
          });
        }
        return res.redirect('/team-member/notifications');
      }

      await db.execute(
        'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = ?',
        [notificationId]
      );

      if (req.accepts('json')) {
        return res.json({
          success: true,
          message: 'Notification marked as read'
        });
      }

      res.redirect('/team-member/notifications?success=Notification marked as read');
    } catch (error) {
      console.error('Mark as read error:', error);
      
      if (req.accepts('json')) {
        return res.status(500).json({
          success: false,
          error: 'Failed to mark notification as read'
        });
      }

      res.redirect('/team-member/notifications');
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;

      await db.execute(
        'UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = ? AND is_read = false',
        [userId]
      );

      if (req.accepts('json')) {
        return res.json({
          success: true,
          message: 'All notifications marked as read'
        });
      }

      res.redirect('/team-member/notifications?success=All notifications marked as read');
    } catch (error) {
      console.error('Mark all as read error:', error);
      
      if (req.accepts('json')) {
        return res.status(500).json({
          success: false,
          error: 'Failed to mark all notifications as read'
        });
      }

      res.redirect('/team-member/notifications');
    }
  },

  // Get notification settings
  getNotificationSettings: async (req, res) => {
    try {
      const userId = req.user.id;

      // Get current notification preferences
      const [preferences] = await db.execute(
        `SELECT 
          email_notifications,
          push_notifications,
          monthly_report,
          expense_reminders,
          budget_alerts,
          team_announcements,
          expense_approval_updates
         FROM user_preferences 
         WHERE user_id = ?`,
        [userId]
      );

      const userPreferences = preferences.length > 0 ? preferences[0] : {
        email_notifications: true,
        push_notifications: true,
        monthly_report: true,
        expense_reminders: true,
        budget_alerts: true,
        team_announcements: true,
        expense_approval_updates: true
      };

      res.render('teamMember/notifications/settings', {
        title: 'Notification Settings - FinMate',
        user: req.user,
        preferences: userPreferences,
        success: req.query.success,
        errors: req.session.errors
      });

      delete req.session.errors;
    } catch (error) {
      console.error('Notification settings fetch error:', error);
      res.status(500).render('teamMember/error', {
        title: 'Error - FinMate',
        user: req.user,
        error: { message: 'Failed to load notification settings', status: 500 }
      });
    }
  },

  // Update notification settings
  updateNotificationSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        email_notifications, 
        push_notifications, 
        monthly_report, 
        expense_reminders, 
        budget_alerts,
        team_announcements,
        expense_approval_updates
      } = req.body;

      // Convert checkbox values to boolean
      const settings = {
        email_notifications: email_notifications === 'on',
        push_notifications: push_notifications === 'on',
        monthly_report: monthly_report === 'on',
        expense_reminders: expense_reminders === 'on',
        budget_alerts: budget_alerts === 'on',
        team_announcements: team_announcements === 'on',
        expense_approval_updates: expense_approval_updates === 'on'
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
               expense_reminders = ?, budget_alerts = ?, team_announcements = ?,
               expense_approval_updates = ?, updated_at = NOW() 
           WHERE user_id = ?`,
          [
            settings.email_notifications,
            settings.push_notifications,
            settings.monthly_report,
            settings.expense_reminders,
            settings.budget_alerts,
            settings.team_announcements,
            settings.expense_approval_updates,
            userId
          ]
        );
      } else {
        // Insert new preferences
        await db.execute(
          `INSERT INTO user_preferences 
           (user_id, email_notifications, push_notifications, monthly_report, 
            expense_reminders, budget_alerts, team_announcements, expense_approval_updates) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            settings.email_notifications,
            settings.push_notifications,
            settings.monthly_report,
            settings.expense_reminders,
            settings.budget_alerts,
            settings.team_announcements,
            settings.expense_approval_updates
          ]
        );
      }

      res.redirect('/team-member/notifications/settings?success=Notification settings updated successfully');
    } catch (error) {
      console.error('Notification settings update error:', error);
      req.session.errors = ['Failed to update notification settings. Please try again.'];
      res.redirect('/team-member/notifications/settings');
    }
  },

  // Create a notification (utility method for other controllers)
  createNotification: async (userId, title, message, type = 'info', senderId = null, relatedEntity = null, relatedEntityId = null) => {
    try {
      await db.execute(
        `INSERT INTO notifications 
         (user_id, title, message, type, sender_id, related_entity, related_entity_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, title, message, type, senderId, relatedEntity, relatedEntityId]
      );
      return true;
    } catch (error) {
      console.error('Create notification error:', error);
      return false;
    }
  }
};

module.exports = notificationController;