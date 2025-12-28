const express = require('express');
const router = express.Router();
const {
  getAllDrivers,
  getDriverById,
  updateDriver,
  toggleDuty,
  getAvailableDrivers,
  deleteDriver
} = require('../controllers/driverController');
const { protect, admin, driver } = require('../middleware/auth');

router.get('/', protect, getAllDrivers);
router.get('/available', protect, getAvailableDrivers);
router.get('/:id', protect, getDriverById);
router.put('/:id', protect, admin, updateDriver);
router.put('/:id/duty', protect, driver, toggleDuty);
router.delete('/:id', protect, admin, deleteDriver);

module.exports = router;
