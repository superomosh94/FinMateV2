const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, email, password, first_name, last_name, role_id, team_id } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    try {
      const [result] = await db.pool.execute(
        `INSERT INTO users (username, email, password, first_name, last_name, role_id, team_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, email, hashedPassword, first_name, last_name, role_id, team_id]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await db.pool.execute(
        `SELECT u.*, r.name as role_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.email = ? AND u.is_active = TRUE`,
        [email]
      );
      return rows[0];
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.pool.execute(
        `SELECT u.*, r.name as role_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ? AND u.is_active = TRUE`,
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async findByUsername(username) {
    try {
      const [rows] = await db.pool.execute(
        `SELECT u.*, r.name as role_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.username = ? AND u.is_active = TRUE`,
        [username]
      );
      return rows[0];
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  }

  static async update(id, userData) {
    const { username, email, first_name, last_name, role_id, team_id } = userData;
    
    try {
      const [result] = await db.pool.execute(
        `UPDATE users 
         SET username = ?, email = ?, first_name = ?, last_name = ?, role_id = ?, team_id = ? 
         WHERE id = ?`,
        [username, email, first_name, last_name, role_id, team_id, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.pool.execute(
        'UPDATE users SET is_active = FALSE WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.pool.execute(
        `SELECT u.*, r.name as role_name, t.name as team_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         LEFT JOIN teams t ON u.team_id = t.id 
         WHERE u.is_active = TRUE 
         ORDER BY u.created_at DESC`
      );
      return rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return false;
    }
  }

  static async changePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    try {
      const [result] = await db.pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
}

module.exports = User;