const express = require('express');
const router = express.Router();
const {
  getAllShifts,
  createShift,
  updateShift,
  deleteShift,
  getTodayShifts,
  bulkCreateShifts
} = require('../controllers/shiftController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, getAllShifts);
router.get('/today', protect, getTodayShifts);
router.post('/', protect, admin, createShift);
router.post('/bulk', protect, admin, bulkCreateShifts);
router.put('/:id', protect, admin, updateShift);
router.delete('/:id', protect, admin, deleteShift);

module.exports = router;
