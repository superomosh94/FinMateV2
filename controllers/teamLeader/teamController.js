const db = require('../../config/db');

const teamController = {
  getTeams: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get teams where user is team leader
      const [teams] = await db.pool.execute(
        `SELECT t.*, 
         (SELECT COUNT(*) FROM users WHERE team_id = t.id AND is_active = TRUE) as member_count
         FROM teams t 
         WHERE t.team_leader_id = ?`,
        [userId]
      );

      // Get team members for each team
      for (let team of teams) {
        const [members] = await db.pool.execute(
          `SELECT u.*, r.name as role_name 
           FROM users u 
           JOIN roles r ON u.role_id = r.id 
           WHERE u.team_id = ? AND u.is_active = TRUE`,
          [team.id]
        );
        team.members = members;
      }

      res.render('teamLeader/teams/index', {
        title: 'My Teams - FinMate',
        teams,
        user: req.user
      });
    } catch (error) {
      console.error('Get teams error:', error);
      res.render('teamLeader/teams/index', {
        title: 'My Teams - FinMate',
        teams: [],
        user: req.user
      });
    }
  }
};

module.exports = teamController;