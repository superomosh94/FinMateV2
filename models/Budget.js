const db = require('../config/db');

class Budget {
  static async findAll(filters = {}) {
    let query = `
      SELECT b.*, u.username, u.first_name, u.last_name, t.name as team_name 
      FROM budgets b 
      JOIN users u ON b.user_id = u.id 
      LEFT JOIN teams t ON b.team_id = t.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND b.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.team_id) {
      query += ' AND b.team_id = ?';
      params.push(filters.team_id);
    }

    if (filters.category) {
      query += ' AND b.category = ?';
      params.push(filters.category);
    }

    if (filters.period) {
      query += ' AND b.period = ?';
      params.push(filters.period);
    }

    query += ' ORDER BY b.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const [rows] = await db.pool.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.pool.execute(
      `SELECT b.*, u.username, u.first_name, u.last_name, t.name as team_name 
       FROM budgets b 
       JOIN users u ON b.user_id = u.id 
       LEFT JOIN teams t ON b.team_id = t.id 
       WHERE b.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async create(budgetData) {
    const { user_id, team_id, category, amount, period, start_date, end_date } = budgetData;
    const [result] = await db.pool.execute(
      `INSERT INTO budgets (user_id, team_id, category, amount, period, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, team_id, category, amount, period, start_date, end_date]
    );
    return result.insertId;
  }

  static async update(id, budgetData) {
    const { category, amount, period, start_date, end_date } = budgetData;
    const [result] = await db.pool.execute(
      `UPDATE budgets SET category = ?, amount = ?, period = ?, start_date = ?, end_date = ? 
       WHERE id = ?`,
      [category, amount, period, start_date, end_date, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.pool.execute('DELETE FROM budgets WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getTotalAmount(filters = {}) {
    let query = 'SELECT SUM(amount) as total FROM budgets WHERE 1=1';
    const params = [];

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.team_id) {
      query += ' AND team_id = ?';
      params.push(filters.team_id);
    }

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    const [rows] = await db.pool.execute(query, params);
    return rows[0]?.total || 0;
  }

  static async getByCategory(filters = {}) {
    let query = `
      SELECT category, SUM(amount) as total, COUNT(*) as count 
      FROM budgets 
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.team_id) {
      query += ' AND team_id = ?';
      params.push(filters.team_id);
    }

    query += ' GROUP BY category ORDER BY total DESC';

    const [rows] = await db.pool.execute(query, params);
    return rows;
  }
}

module.exports = Budget;    