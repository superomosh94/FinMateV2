const db = require('../config/db');

class PlannedExpense {
  static async findAll(filters = {}) {
    let query = `
      SELECT pe.*, u.username, u.first_name, u.last_name, t.name as team_name 
      FROM planned_expenses pe 
      JOIN users u ON pe.user_id = u.id 
      LEFT JOIN teams t ON pe.team_id = t.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND pe.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.team_id) {
      query += ' AND pe.team_id = ?';
      params.push(filters.team_id);
    }

    if (filters.status) {
      query += ' AND pe.status = ?';
      params.push(filters.status);
    }

    if (filters.category) {
      query += ' AND pe.category = ?';
      params.push(filters.category);
    }

    if (filters.start_date) {
      query += ' AND pe.planned_date >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND pe.planned_date <= ?';
      params.push(filters.end_date);
    }

    query += ' ORDER BY pe.planned_date DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const [rows] = await db.pool.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.pool.execute(
      `SELECT pe.*, u.username, u.first_name, u.last_name, t.name as team_name 
       FROM planned_expenses pe 
       JOIN users u ON pe.user_id = u.id 
       LEFT JOIN teams t ON pe.team_id = t.id 
       WHERE pe.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async create(plannedExpenseData) {
    const { user_id, team_id, amount, description, category, planned_date, status } = plannedExpenseData;
    const [result] = await db.pool.execute(
      `INSERT INTO planned_expenses (user_id, team_id, amount, description, category, planned_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, team_id, amount, description, category, planned_date, status || 'planned']
    );
    return result.insertId;
  }

  static async update(id, plannedExpenseData) {
    const { amount, description, category, planned_date, status } = plannedExpenseData;
    const [result] = await db.pool.execute(
      `UPDATE planned_expenses SET amount = ?, description = ?, category = ?, planned_date = ?, status = ? 
       WHERE id = ?`,
      [amount, description, category, planned_date, status, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.pool.execute('DELETE FROM planned_expenses WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getTotalAmount(filters = {}) {
    let query = 'SELECT SUM(amount) as total FROM planned_expenses WHERE 1=1';
    const params = [];

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.team_id) {
      query += ' AND team_id = ?';
      params.push(filters.team_id);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.start_date) {
      query += ' AND planned_date >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND planned_date <= ?';
      params.push(filters.end_date);
    }

    const [rows] = await db.pool.execute(query, params);
    return rows[0]?.total || 0;
  }
}

module.exports = PlannedExpense;