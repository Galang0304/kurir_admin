const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  assignOrder,
  getDriverOrders,
  getOrderStats,
  getOrdersByCustomerPhone
} = require('../controllers/orderController');
const { protect, admin, driver } = require('../middleware/auth');

router.get('/', protect, getAllOrders);
router.get('/stats', protect, getOrderStats);
router.get('/customer/:phone', getOrdersByCustomerPhone); // Public - for WhatsApp bot
router.get('/driver/:driverId', protect, driver, getDriverOrders);
router.get('/:id', protect, getOrderById);
router.post('/', createOrder); // Public - called by WhatsApp bot
router.put('/:id/status', protect, driver, updateOrderStatus);
router.put('/:id/assign', protect, admin, assignOrder);

module.exports = router;
