const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', incomeController.getIncomes);
router.get('/:id', incomeController.getIncomeById);
router.post('/', incomeController.createIncome);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);
router.get('/stats/summary', incomeController.getIncomeSummary);

module.exports = router;