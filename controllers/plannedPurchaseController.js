// controllers/plannedPurchaseController.js
const getDb = () => require('../config/db');

// Helper functions
const handleMySQL2Result = (result) => {
  return Array.isArray(result) ? result : [];
};

const getFirstRow = (result) => {
  const rows = handleMySQL2Result(result);
  return rows.length > 0 ? rows[0] : null;
};

// Get notification count helper
const getNotificationCount = async (userId) => {
  try {
    const db = getDb();
    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const notificationData = getFirstRow(notificationRows);
    return parseInt(notificationData?.notificationCount, 10) || 0;
  } catch (error) {
    console.error('Error getting notification count:', error);
    return 0;
  }
};

// Create a new planned purchase
const createPlannedPurchase = async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { title, description, category, planned_amount, quantity, period } = req.body;

    // Validate required fields
    if (!title || !planned_amount || !period) {
      const notificationCount = await getNotificationCount(userId);
      return res.render('individualUser/upcoming-expenses/add', { // Changed to upcoming-expenses
        title: 'Add Upcoming Expense',
        user: req.user,
        currentPage: 'upcoming-expenses', // Changed current page
        formData: req.body,
        notificationCount: notificationCount,
        error: 'Title, planned amount, and period are required fields'
      });
    }

    // Insert the planned purchase
    const result = await db.execute(
      `INSERT INTO planned_purchases 
       (user_id, title, description, category, planned_amount, quantity, period, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        userId, 
        title,
        description || null,
        category || null,
        parseFloat(planned_amount),
        parseInt(quantity) || 1,
        period
      ]
    );

    if (result && result.affectedRows > 0) {
      // Redirect to upcoming expenses list with success message
      return res.redirect('/user/upcoming-expenses?success=true&message=Upcoming expense created successfully'); // Changed to upcoming-expenses
    } else {
      throw new Error('No rows were affected - planned purchase not created');
    }
    
  } catch (error) {
    console.error('❌ Create planned purchase error:', error);
    
    let errorMessage = 'Failed to create upcoming expense';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'An upcoming expense with this title already exists';
    } else if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    }

    const notificationCount = await getNotificationCount(req.user.id);

    // Render the add form with error
    res.render('individualUser/upcoming-expenses/add', { // Changed to upcoming-expenses
      title: 'Add Upcoming Expense',
      user: req.user,
      currentPage: 'upcoming-expenses', // Changed current page
      formData: req.body,
      notificationCount: notificationCount,
      error: errorMessage
    });
  }
};

// Get all planned purchases for a user - Render HTML page
const getPlannedPurchases = async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { status, period, showCompleted = 'true' } = req.query;
    
    let query = `SELECT * FROM planned_purchases WHERE user_id = ?`;
    const params = [userId];
    
    // Apply filters
    if (status !== undefined) {
      query += ` AND status = ?`;
      params.push(status);
    }
    
    if (period) {
      query += ` AND period = ?`;
      params.push(period);
    }
    
    if (showCompleted === 'false') {
      query += ` AND status = 0`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await db.execute(query, params);
    const purchases = handleMySQL2Result(result);

    // Calculate summary statistics
    const totalPlanned = purchases.reduce((sum, purchase) => {
      return sum + (parseFloat(purchase.planned_amount || 0) * parseInt(purchase.quantity || 1));
    }, 0);

    const pendingCount = purchases.filter(p => !p.status).length;
    const completedCount = purchases.filter(p => p.status).length;

    const notificationCount = await getNotificationCount(userId);

    // Render the HTML page - CHANGED TO upcoming-expenses
    res.render('individualUser/upcoming-expenses/list', { // Changed to upcoming-expenses
      title: 'Upcoming Expenses', // Changed title
      user: req.user,
      currentPage: 'upcoming-expenses', // Changed current page
      purchases: purchases,
      totalPlanned: totalPlanned,
      pendingCount: pendingCount,
      completedCount: completedCount,
      statusFilter: status || '',
      periodFilter: period || '',
      showCompleted: showCompleted === 'true',
      notificationCount: notificationCount,
      success: req.query.success || false,
      message: req.query.message || '',
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Get planned purchases error:', error);
    
    const notificationCount = await getNotificationCount(req.user.id);
    
    res.render('individualUser/upcoming-expenses/list', { // Changed to upcoming-expenses
      title: 'Upcoming Expenses', // Changed title
      user: req.user,
      currentPage: 'upcoming-expenses', // Changed current page
      purchases: [],
      totalPlanned: 0,
      pendingCount: 0,
      completedCount: 0,
      statusFilter: '',
      periodFilter: '',
      showCompleted: true,
      notificationCount: notificationCount,
      error: 'Unable to load upcoming expenses' // Changed error message
    });
  }
};

// Get a single planned purchase by ID - Render edit page
const getPlannedPurchaseById = async (req, res) => {
  try {
    const db = getDb();
    const purchaseId = req.params.id;
    const userId = req.user.id;

    const result = await db.execute(
      `SELECT * FROM planned_purchases WHERE id = ? AND user_id = ?`,
      [purchaseId, userId]
    );

    const purchase = getFirstRow(result);

    if (!purchase) {
      return res.redirect('/user/upcoming-expenses?error=Upcoming expense not found'); // Changed to upcoming-expenses
    }

    const notificationCount = await getNotificationCount(userId);

    // Render the edit page - CHANGED TO upcoming-expenses
    res.render('individualUser/upcoming-expenses/edit', { // Changed to upcoming-expenses
      title: 'Edit Upcoming Expense', // Changed title
      user: req.user,
      currentPage: 'upcoming-expenses', // Changed current page
      purchase: purchase,
      notificationCount: notificationCount,
      success: req.query.success || false,
      message: req.query.message || '',
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Get planned purchase by ID error:', error);
    res.redirect('/user/upcoming-expenses?error=Failed to load upcoming expense'); // Changed to upcoming-expenses
  }
};

// Update a planned purchase
const updatePlannedPurchase = async (req, res) => {
  try {
    const db = getDb();
    const purchaseId = req.params.id;
    const userId = req.user.id;
    const { title, description, category, planned_amount, quantity, period, status } = req.body;

    // Check if purchase exists and belongs to user
    const checkResult = await db.execute(
      `SELECT id FROM planned_purchases WHERE id = ? AND user_id = ?`,
      [purchaseId, userId]
    );

    const existingPurchase = getFirstRow(checkResult);
    if (!existingPurchase) {
      return res.redirect('/user/upcoming-expenses?error=Upcoming expense not found'); // Changed to upcoming-expenses
    }

    // Update the purchase
    const result = await db.execute(
      `UPDATE planned_purchases 
       SET title = ?, description = ?, category = ?, planned_amount = ?, 
           quantity = ?, period = ?, status = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [
        title,
        description || null,
        category || null,
        parseFloat(planned_amount),
        parseInt(quantity) || 1,
        period,
        status ? 1 : 0,
        purchaseId,
        userId
      ]
    );

    if (result && result.affectedRows > 0) {
      // Redirect to upcoming expenses list with success message
      return res.redirect('/user/upcoming-expenses?success=true&message=Upcoming expense updated successfully'); // Changed to upcoming-expenses
    } else {
      throw new Error('Failed to update planned purchase');
    }
    
  } catch (error) {
    console.error('❌ Update planned purchase error:', error);
    
    let errorMessage = 'Failed to update upcoming expense';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'An upcoming expense with this title already exists';
    } else if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    }

    res.redirect(`/user/upcoming-expenses/edit/${req.params.id}?error=${encodeURIComponent(errorMessage)}`); // Changed to upcoming-expenses
  }
};

// Delete a planned purchase
const deletePlannedPurchase = async (req, res) => {
  try {
    const db = getDb();
    const purchaseId = req.params.id;
    const userId = req.user.id;

    const result = await db.execute(
      `DELETE FROM planned_purchases WHERE id = ? AND user_id = ?`,
      [purchaseId, userId]
    );

    if (result && result.affectedRows > 0) {
      // Redirect to upcoming expenses list with success message
      return res.redirect('/user/upcoming-expenses?success=true&message=Upcoming expense deleted successfully'); // Changed to upcoming-expenses
    } else {
      return res.redirect('/user/upcoming-expenses?error=Upcoming expense not found'); // Changed to upcoming-expenses
    }
    
  } catch (error) {
    console.error('❌ Delete planned purchase error:', error);
    res.redirect('/user/upcoming-expenses?error=Failed to delete upcoming expense'); // Changed to upcoming-expenses
  }
};

// Toggle purchase status
const togglePurchaseStatus = async (req, res) => {
  try {
    const db = getDb();
    const purchaseId = req.params.id;
    const userId = req.user.id;

    // Get current status
    const currentResult = await db.execute(
      `SELECT status FROM planned_purchases WHERE id = ? AND user_id = ?`,
      [purchaseId, userId]
    );

    const currentData = getFirstRow(currentResult);
    if (!currentData) {
      return res.redirect('/user/upcoming-expenses?error=Upcoming expense not found'); // Changed to upcoming-expenses
    }

    const newStatus = currentData.status ? 0 : 1;

    const result = await db.execute(
      `UPDATE planned_purchases SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      [newStatus, purchaseId, userId]
    );

    if (result && result.affectedRows > 0) {
      const message = newStatus ? 'Upcoming expense marked as completed' : 'Upcoming expense marked as pending';
      // Redirect to upcoming expenses list with success message
      return res.redirect(`/user/upcoming-expenses?success=true&message=${encodeURIComponent(message)}`); // Changed to upcoming-expenses
    }

    throw new Error('Failed to update purchase status');
    
  } catch (error) {
    console.error('❌ Toggle purchase status error:', error);
    res.redirect('/user/upcoming-expenses?error=Failed to update upcoming expense status'); // Changed to upcoming-expenses
  }
};

module.exports = {
  createPlannedPurchase,
  getPlannedPurchases,
  getPlannedPurchaseById,
  updatePlannedPurchase,
  deletePlannedPurchase,
  togglePurchaseStatus
};