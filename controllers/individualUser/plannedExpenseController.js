const pool = require('../../config/db');

const getPlannedExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT * FROM planned_expenses 
      WHERE user_id = ? 
      ORDER BY planned_date ASC
    `;
    const [plannedExpenses] = await pool.execute(query, [userId]);
    
    res.render('individualUser/planned-expenses/list', { // ✅ FIXED: hyphen
      title: 'Planned Expenses',
      currentPage: 'planned-expenses',
      user: req.user,
      plannedExpenses: plannedExpenses
    });
  } catch (error) {
    console.error('Get planned expenses error:', error);
    res.status(500).render('individualUser/planned-expenses/list', { // ✅ FIXED: hyphen
      title: 'Planned Expenses',
      currentPage: 'planned-expenses',
      user: req.user,
      error: 'Failed to load planned expenses'
    });
  }
};

const getAddPlannedExpense = async (req, res) => {
  res.render('individualUser/planned-expenses/add', { // ✅ FIXED: hyphen
    title: 'Add Planned Expense',
    currentPage: 'planned-expenses',
    user: req.user
  });
};

const postAddPlannedExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, description, category, planned_date, recurrence } = req.body;
    
    const query = `
      INSERT INTO planned_expenses (user_id, amount, description, category, planned_date, recurrence) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.execute(query, [userId, amount, description, category, planned_date, recurrence]);
    
    res.redirect('/user/planned-expenses?success=true&message=Planned expense added successfully');
  } catch (error) {
    console.error('Add planned expense error:', error);
    res.render('individualUser/planned-expenses/add', { // ✅ FIXED: hyphen
      title: 'Add Planned Expense',
      currentPage: 'planned-expenses',
      user: req.user,
      error: 'Failed to add planned expense'
    });
  }
};

const getEditPlannedExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const query = 'SELECT * FROM planned_expenses WHERE id = ? AND user_id = ?';
    const [plannedExpenses] = await pool.execute(query, [id, userId]);
    
    if (plannedExpenses.length === 0) {
      return res.status(404).render('error', { 
        title: 'Not Found',
        error: 'Planned expense not found' 
      });
    }
    
    res.render('individualUser/planned-expenses/edit', { // ✅ FIXED: hyphen
      title: 'Edit Planned Expense',
      currentPage: 'planned-expenses',
      user: req.user,
      expense: plannedExpenses[0]
    });
  } catch (error) {
    console.error('Get edit planned expense error:', error);
    res.status(500).render('individualUser/planned-expenses/edit', { // ✅ FIXED: hyphen
      title: 'Edit Planned Expense',
      currentPage: 'planned-expenses',
      user: req.user,
      error: 'Failed to load planned expense'
    });
  }
};

const postEditPlannedExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount, description, category, planned_date, recurrence } = req.body;
    
    const query = `
      UPDATE planned_expenses 
      SET amount = ?, description = ?, category = ?, planned_date = ?, recurrence = ? 
      WHERE id = ? AND user_id = ?
    `;
    await pool.execute(query, [amount, description, category, planned_date, recurrence, id, userId]);
    
    res.redirect('/user/planned-expenses?success=true&message=Planned expense updated successfully');
  } catch (error) {
    console.error('Edit planned expense error:', error);
    res.render('individualUser/planned-expenses/edit', { // ✅ FIXED: hyphen
      title: 'Edit Planned Expense',
      currentPage: 'planned-expenses',
      user: req.user,
      error: 'Failed to update planned expense'
    });
  }
};

const deletePlannedExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const query = 'DELETE FROM planned_expenses WHERE id = ? AND user_id = ?';
    await pool.execute(query, [id, userId]);
    
    res.redirect('/user/planned-expenses?success=true&message=Planned expense deleted successfully');
  } catch (error) {
    console.error('Delete planned expense error:', error);
    res.redirect('/user/planned-expenses?error=Failed to delete planned expense');
  }
};

module.exports = {
  getPlannedExpenses,
  getAddPlannedExpense,
  postAddPlannedExpense,
  getEditPlannedExpense,
  postEditPlannedExpense,
  deletePlannedExpense
};