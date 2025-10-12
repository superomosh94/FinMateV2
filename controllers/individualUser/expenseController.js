const pool = require('../../config/db');

const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Getting expenses for user ID:', userId);

    // First, let's check what tables exist and their structure
    const checkTablesQuery = `
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = ? AND TABLE_NAME = 'expenses'
    `;
    const [tables] = await pool.execute(checkTablesQuery, [process.env.DB_NAME || 'finmatedb']);
    console.log('📋 Expenses table exists:', tables.length > 0);

    if (tables.length > 0) {
      // Check the structure of the expenses table
      const tableStructureQuery = `DESCRIBE expenses`;
      const [structure] = await pool.execute(tableStructureQuery);
      console.log('🏗️ Expenses table structure:', structure);
    }

    // Get all expenses for this user
    const query = `SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC`;
    const [expenses] = await pool.execute(query, [userId]);
    
    console.log('📊 Expenses found:', expenses.length);
    console.log('📝 Expenses data:', expenses);

    // Render the view with data
    res.render('individualUser/expenses/list', {
      title: 'My Expenses',
      currentPage: 'expenses',
      user: req.user,
      expenses: expenses,
      success: req.query.success,
      message: req.query.message,
      error: req.query.error
    });
  } catch (error) {
    console.error('❌ Get expenses error:', error);
    res.render('individualUser/expenses/list', {
      title: 'My Expenses',
      currentPage: 'expenses',
      user: req.user,
      error: 'Failed to load expenses: ' + error.message
    });
  }
};

const postAddExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, description, category, date } = req.body;
    
    console.log('➕ Adding expense for user:', userId);
    console.log('📋 Expense data:', { amount, description, category, date });

    // Check what columns exist in the expenses table
    const checkColumnsQuery = `SHOW COLUMNS FROM expenses`;
    const [columns] = await pool.execute(checkColumnsQuery);
    console.log('🏗️ Expenses table columns:', columns);

    // Try different column names for date
    let dateColumn = 'date';
    const dateColumns = columns.filter(col => 
      col.Field === 'date' || col.Field === 'expense_date' || col.Field === 'created_at'
    );
    if (dateColumns.length > 0) {
      dateColumn = dateColumns[0].Field;
    }
    console.log('📅 Using date column:', dateColumn);

    const query = `
      INSERT INTO expenses (user_id, amount, description, category, ${dateColumn}) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [userId, amount, description, category, date]);
    
    console.log('✅ Expense added with ID:', result.insertId);

    res.redirect('/user/expenses?success=true&message=Expense added successfully');
  } catch (error) {
    console.error('❌ Add expense error:', error);
    res.render('individualUser/expenses/add', {
      title: 'Add Expense',
      currentPage: 'expenses',
      user: req.user,
      error: 'Failed to add expense: ' + error.message
    });
  }
};

// ... keep other functions the same