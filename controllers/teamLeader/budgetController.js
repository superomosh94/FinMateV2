const db = require('../../config/db');

const getBudgets = async (req, res) => {
  try {
    const [budgets] = await db.pool.execute(
      'SELECT * FROM budgets WHERE team_id = ? ORDER BY created_at DESC',
      [req.user.team_id]
    );
    
    res.render('team-leader/budgets', {
      title: 'Team Budgets - FinMate',
      user: req.user,
      budgets: budgets || []
    });
  } catch (error) {
    console.error('💥 Budgets error:', error);
    res.render('team-leader/budgets', {
      title: 'Team Budgets - FinMate',
      user: req.user,
      budgets: []
    });
  }
};

const getCurrentBudgets = async (req, res) => {
  res.render('team-leader/budgets-current', {
    title: 'Current Budgets - FinMate',
    user: req.user
  });
};

const getCreateBudget = (req, res) => {
  res.render('team-leader/budgets-create', {
    title: 'Create Budget - FinMate',
    user: req.user
  });
};

const postCreateBudget = async (req, res) => {
  try {
    const { name, amount, category, description } = req.body;
    await db.pool.execute(
      'INSERT INTO budgets (name, amount, category, description, team_id, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name, amount, category, description, req.user.team_id, req.user.id]
    );
    res.redirect('/team-leader/budgets?success=Budget created successfully');
  } catch (error) {
    console.error('💥 Create budget error:', error);
    res.redirect('/team-leader/budgets/create?error=Failed to create budget');
  }
};

const getEditBudget = async (req, res) => {
  try {
    const [budgets] = await db.pool.execute(
      'SELECT * FROM budgets WHERE id = ? AND team_id = ?',
      [req.params.id, req.user.team_id]
    );
    
    if (budgets.length === 0) {
      return res.redirect('/team-leader/budgets?error=Budget not found');
    }
    
    res.render('team-leader/budgets-edit', {
      title: 'Edit Budget - FinMate',
      user: req.user,
      budget: budgets[0]
    });
  } catch (error) {
    console.error('💥 Edit budget error:', error);
    res.redirect('/team-leader/budgets?error=Failed to load budget');
  }
};

const postEditBudget = async (req, res) => {
  try {
    const { name, amount, category, description } = req.body;
    await db.pool.execute(
      'UPDATE budgets SET name = ?, amount = ?, category = ?, description = ? WHERE id = ? AND team_id = ?',
      [name, amount, category, description, req.params.id, req.user.team_id]
    );
    res.redirect('/team-leader/budgets?success=Budget updated successfully');
  } catch (error) {
    console.error('💥 Update budget error:', error);
    res.redirect('/team-leader/budgets/edit/' + req.params.id + '?error=Failed to update budget');
  }
};

const deleteBudget = async (req, res) => {
  try {
    await db.pool.execute(
      'DELETE FROM budgets WHERE id = ? AND team_id = ?',
      [req.params.id, req.user.team_id]
    );
    res.redirect('/team-leader/budgets?success=Budget deleted successfully');
  } catch (error) {
    console.error('💥 Delete budget error:', error);
    res.redirect('/team-leader/budgets?error=Failed to delete budget');
  }
};

const getBudgetAnalytics = async (req, res) => {
  res.render('team-leader/budgets-analytics', {
    title: 'Budget Analytics - FinMate',
    user: req.user,
    budgetId: req.params.id
  });
};

const getBudgetUsage = async (req, res) => {
  res.render('team-leader/budgets-usage', {
    title: 'Budget Usage - FinMate',
    user: req.user
  });
};

const getBudgetOverview = async (req, res) => {
  try {
    const [overview] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_budgets,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(spent), 0) as total_spent
      FROM budgets 
      WHERE team_id = ?
    `, [req.user.team_id]);
    
    res.json(overview[0] || {});
  } catch (error) {
    console.error('💥 Budget overview error:', error);
    res.status(500).json({ error: 'Failed to fetch budget overview' });
  }
};

module.exports = {
  getBudgets,
  getCurrentBudgets,
  getCreateBudget,
  postCreateBudget,
  getEditBudget,
  postEditBudget,
  deleteBudget,
  getBudgetAnalytics,
  getBudgetUsage,
  getBudgetOverview
};