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

// Create a new planned purchase
const createPlannedPurchase = async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { title, description, category, planned_amount, quantity, period } = req.body;

    console.log('📝 Creating planned purchase:', {
      userId,
      title,
      planned_amount,
      period
    });

    // Validate required fields
    if (!title || !planned_amount || !period) {
      return res.status(400).json({
        success: false,
        message: 'Title, planned amount, and period are required fields'
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
      console.log('🎉 Planned purchase created successfully, ID:', result.insertId);
      
      return res.status(201).json({
        success: true,
        message: 'Planned purchase created successfully',
        data: {
          id: result.insertId,
          title,
          planned_amount,
          period
        }
      });
    } else {
      throw new Error('No rows were affected - planned purchase not created');
    }
    
  } catch (error) {
    console.error('❌ Create planned purchase error:', error);
    
    let errorMessage = 'Failed to create planned purchase';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'A planned purchase with this title already exists';
    } else if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// Get all planned purchases for a user
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

    res.json({
      success: true,
      data: purchases,
      count: purchases.length
    });

  } catch (error) {
    console.error('❌ Get planned purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch planned purchases'
    });
  }
};

// Get a single planned purchase by ID
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
      return res.status(404).json({
        success: false,
        message: 'Planned purchase not found'
      });
    }

    res.json({
      success: true,
      data: purchase
    });

  } catch (error) {
    console.error('❌ Get planned purchase by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch planned purchase'
    });
  }
};

// Update a planned purchase
const updatePlannedPurchase = async (req, res) => {
  try {
    const db = getDb();
    const purchaseId = req.params.id;
    const userId = req.user.id;
    const { title, description, category, planned_amount, quantity, period, status } = req.body;

    console.log('📝 Updating planned purchase:', {
      purchaseId,
      userId,
      title,
      planned_amount,
      period
    });

    // Check if purchase exists and belongs to user
    const checkResult = await db.execute(
      `SELECT id FROM planned_purchases WHERE id = ? AND user_id = ?`,
      [purchaseId, userId]
    );

    const existingPurchase = getFirstRow(checkResult);
    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        message: 'Planned purchase not found'
      });
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
      console.log('✅ Planned purchase updated successfully');
      
      return res.json({
        success: true,
        message: 'Planned purchase updated successfully'
      });
    } else {
      throw new Error('Failed to update planned purchase');
    }
    
  } catch (error) {
    console.error('❌ Update planned purchase error:', error);
    
    let errorMessage = 'Failed to update planned purchase';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'A planned purchase with this title already exists';
    } else if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// Delete a planned purchase
const deletePlannedPurchase = async (req, res) => {
  try {
    const db = getDb();
    const purchaseId = req.params.id;
    const userId = req.user.id;

    console.log('🗑️ Deleting planned purchase:', { purchaseId, userId });

    const result = await db.execute(
      `DELETE FROM planned_purchases WHERE id = ? AND user_id = ?`,
      [purchaseId, userId]
    );

    if (result && result.affectedRows > 0) {
      console.log('✅ Planned purchase deleted successfully');
      
      return res.json({
        success: true,
        message: 'Planned purchase deleted successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Planned purchase not found'
      });
    }
    
  } catch (error) {
    console.error('❌ Delete planned purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete planned purchase'
    });
  }
};

// Toggle purchase status
const togglePurchaseStatus = async (req, res) => {
  try {
    const db = getDb();
    const purchaseId = req.params.id;
    const userId = req.user.id;

    console.log('🔄 Toggling purchase status:', { purchaseId, userId });

    // Get current status
    const currentResult = await db.execute(
      `SELECT status FROM planned_purchases WHERE id = ? AND user_id = ?`,
      [purchaseId, userId]
    );

    const currentData = getFirstRow(currentResult);
    if (!currentData) {
      return res.status(404).json({
        success: false,
        message: 'Planned purchase not found'
      });
    }

    const newStatus = currentData.status ? 0 : 1;

    const result = await db.execute(
      `UPDATE planned_purchases SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      [newStatus, purchaseId, userId]
    );

    if (result && result.affectedRows > 0) {
      const message = newStatus ? 'Purchase marked as completed' : 'Purchase marked as pending';
      console.log('✅ Purchase status toggled:', message);
      
      return res.json({
        success: true,
        message: message
      });
    }

    throw new Error('Failed to update purchase status');
    
  } catch (error) {
    console.error('❌ Toggle purchase status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase status'
    });
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