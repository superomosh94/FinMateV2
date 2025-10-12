const db = require('../config/db');

// Service functions directly in controller (temporary fix)
const expenseService = {
    getUserExpenses: async (userId) => {
        try {
            console.log('🔍 Fetching expenses for user:', userId);
            
            const [rows] = await db.query(`
                SELECT 
                    id,
                    user_id,
                    amount,
                    description,
                    category,
                    DATE(date) as date,
                    status,
                    created_at,
                    updated_at
                FROM expenses 
                WHERE user_id = ? 
                ORDER BY date DESC, created_at DESC
            `, [userId]);

            console.log('✅ Expenses fetched successfully, count:', rows.length);
            return rows;
            
        } catch (error) {
            console.error('❌ Error fetching user expenses:', error);
            throw error;
        }
    },

    addExpense: async (expenseData) => {
        try {
            console.log('💾 Adding expense:', expenseData);
            
            const { user_id, amount, description, category, date } = expenseData;
            
            const [result] = await db.query(`
                INSERT INTO expenses (user_id, amount, description, category, date, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'pending', NOW())
            `, [user_id, amount, description, category, date]);

            console.log('✅ Expense added successfully, ID:', result.insertId);
            
            const [newExpense] = await db.query(`
                SELECT * FROM expenses WHERE id = ?
            `, [result.insertId]);
            
            return newExpense[0];
            
        } catch (error) {
            console.error('❌ Error adding expense:', error);
            throw error;
        }
    },

    calculateExpenseStats: async (userId) => {
        try {
            const expenses = await expenseService.getUserExpenses(userId);
            
            // ... rest of your stats calculation code
            return stats;
            
        } catch (error) {
            console.error('❌ Error calculating expense stats:', error);
            throw error;
        }
    }
};

// Controller functions
exports.getUserExpenses = async (req, res) => {
    try {
        const userId = req.user.id;
        const expenses = await expenseService.getUserExpenses(userId);
        
        res.json({
            success: true,
            data: expenses,
            count: expenses.length
        });
    } catch (error) {
        console.error('❌ Controller error fetching expenses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expenses',
            error: error.message
        });
    }
};

exports.createExpense = async (req, res) => {
    try {
        const expenseData = {
            ...req.body,
            user_id: req.user.id
        };

        const newExpense = await expenseService.addExpense(expenseData);
        
        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: newExpense
        });
    } catch (error) {
        console.error('❌ Controller error creating expense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create expense',
            error: error.message
        });
    }
};

// Add other controller methods as needed...