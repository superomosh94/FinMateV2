const express = require('express');
const router = express.Router();
const plannedPurchaseController = require('../controllers/plannedPurchaseController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', plannedPurchaseController.getPlannedPurchases);
router.get('/:id', plannedPurchaseController.getPlannedPurchaseById);
router.post('/', plannedPurchaseController.createPlannedPurchase);
router.put('/:id', plannedPurchaseController.updatePlannedPurchase);
router.delete('/:id', plannedPurchaseController.deletePlannedPurchase);
router.patch('/:id/toggle', plannedPurchaseController.togglePurchaseStatus);

module.exports = router;