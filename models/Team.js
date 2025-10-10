const db = require('../config/db');

class Team {
  static async findAll() {
    const [rows] = await db.pool.execute(
      `SELECT t.*, u.username as leader_username 
       FROM teams t 
       LEFT JOIN users u ON t.team_leader_id = u.id 
       ORDER BY t.name`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.pool.execute(
      `SELECT t.*, u.username as leader_username 
       FROM teams t 
       LEFT JOIN users u ON t.team_leader_id = u.id 
       WHERE t.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async create(teamData) {
    const { name, description, team_leader_id } = teamData;
    const [result] = await db.pool.execute(
      'INSERT INTO teams (name, description, team_leader_id) VALUES (?, ?, ?)',
      [name, description, team_leader_id]
    );
    return result.insertId;
  }

  static async update(id, teamData) {
    const { name, description, team_leader_id } = teamData;
    const [result] = await db.pool.execute(
      'UPDATE teams SET name = ?, description = ?, team_leader_id = ? WHERE id = ?',
      [name, description, team_leader_id, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.pool.execute('DELETE FROM teams WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getMembers(teamId) {
    const [rows] = await db.pool.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.team_id = ? AND u.is_active = TRUE`,
      [teamId]
    );
    return rows;
  }

  static async addMember(teamId, userId) {
    const [result] = await db.pool.execute(
      'UPDATE users SET team_id = ? WHERE id = ?',
      [teamId, userId]
    );
    return result.affectedRows > 0;
  }

  static async removeMember(teamId, userId) {
    const [result] = await db.pool.execute(
      'UPDATE users SET team_id = NULL WHERE id = ? AND team_id = ?',
      [userId, teamId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Team;