const db = require('../config/db');

class Notification {
  static async findAll(filters = {}) {
    let query = `
      SELECT n.*, u.username 
      FROM notifications n 
      JOIN users u ON n.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND n.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.type) {
      query += ' AND n.type = ?';
      params.push(filters.type);
    }

    if (filters.is_read !== undefined) {
      query += ' AND n.is_read = ?';
      params.push(filters.is_read);
    }

    query += ' ORDER BY n.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const [rows] = await db.pool.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.pool.execute(
      `SELECT n.*, u.username 
       FROM notifications n 
       JOIN users u ON n.user_id = u.id 
       WHERE n.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async create(notificationData) {
    const { user_id, title, message, type } = notificationData;
    const [result] = await db.pool.execute(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES (?, ?, ?, ?)`,
      [user_id, title, message, type]
    );
    return result.insertId;
  }

  static async markAsRead(id) {
    const [result] = await db.pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async markAllAsRead(user_id) {
    const [result] = await db.pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [user_id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.pool.execute('DELETE FROM notifications WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getUnreadCount(user_id) {
    const [rows] = await db.pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [user_id]
    );
    return rows[0]?.count || 0;
  }

  static async createForAllUsers(title, message, type) {
    const [users] = await db.pool.execute('SELECT id FROM users WHERE is_active = TRUE');
    
    for (const user of users) {
      await this.create({
        user_id: user.id,
        title,
        message,
        type
      });
    }
    
    return users.length;
  }
}

module.exports = Notification;