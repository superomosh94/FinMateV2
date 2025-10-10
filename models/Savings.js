const db = require('../config/db');

class Savings {
  static async findAll(filters = {}) {
    let query = `
      SELECT s.*, u.username, u.first_name, u.last_name 
      FROM savings s 
      JOIN users u ON s.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND s.user_id = ?';
      params.push(filters.user_id);
    }

    query += ' ORDER BY s.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const [rows] = await db.pool.execute(query, params);
    
    // Calculate progress for each savings goal
    rows.forEach(goal => {
      goal.progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
    });

    return rows;
  }

  static async findById(id) {
    const [rows] = await db.pool.execute(
      `SELECT s.*, u.username, u.first_name, u.last_name 
       FROM savings s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [id]
    );
    
    if (rows[0]) {
      rows[0].progress = rows[0].target_amount > 0 ? (rows[0].current_amount / rows[0].target_amount) * 100 : 0;
    }
    
    return rows[0];
  }

  static async create(savingsData) {
    const { user_id, goal_name, target_amount, current_amount, target_date } = savingsData;
    const [result] = await db.pool.execute(
      `INSERT INTO savings (user_id, goal_name, target_amount, current_amount, target_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, goal_name, target_amount, current_amount || 0, target_date]
    );
    return result.insertId;
  }

  static async update(id, savingsData) {
    const { goal_name, target_amount, current_amount, target_date } = savingsData;
    const [result] = await db.pool.execute(
      `UPDATE savings SET goal_name = ?, target_amount = ?, current_amount = ?, target_date = ? 
       WHERE id = ?`,
      [goal_name, target_amount, current_amount, target_date, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.pool.execute('DELETE FROM savings WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async addAmount(id, amount) {
    const [result] = await db.pool.execute(
      'UPDATE savings SET current_amount = current_amount + ? WHERE id = ?',
      [amount, id]
    );
    return result.affectedRows > 0;
  }

  static async getTotalSavings(user_id) {
    const [rows] = await db.pool.execute(
      'SELECT SUM(current_amount) as total FROM savings WHERE user_id = ?',
      [user_id]
    );
    return rows[0]?.total || 0;
  }

  static async getCompletedGoals(user_id) {
    const [rows] = await db.pool.execute(
      'SELECT COUNT(*) as count FROM savings WHERE user_id = ? AND current_amount >= target_amount',
      [user_id]
    );
    return rows[0]?.count || 0;
  }
}

module.exports = Savings;