const { Shift, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all shifts
// @route   GET /api/shifts
const getAllShifts = async (req, res) => {
  try {
    const { date, driverId } = req.query;
    let whereClause = {};

    if (date) whereClause.date = date;
    if (driverId) whereClause.driverId = driverId;

    const shifts = await Shift.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name', 'phone']
      }],
      order: [['date', 'DESC'], ['shiftType', 'ASC']]
    });

    res.json(shifts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create shift
// @route   POST /api/shifts
const createShift = async (req, res) => {
  try {
    const { driverId, date, shiftType, startTime, endTime } = req.body;

    // Check if driver exists
    const driver = await User.findOne({
      where: { id: driverId, role: 'driver' }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Check for existing shift
    const existingShift = await Shift.findOne({
      where: { driverId, date, shiftType }
    });

    if (existingShift) {
      return res.status(400).json({ message: 'Shift already exists for this driver on this date' });
    }

    const shift = await Shift.create({
      driverId,
      date,
      shiftType,
      startTime,
      endTime
    });

    const newShift = await Shift.findByPk(shift.id, {
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name', 'phone']
      }]
    });

    res.status(201).json(newShift);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update shift
// @route   PUT /api/shifts/:id
const updateShift = async (req, res) => {
  try {
    const shift = await Shift.findByPk(req.params.id);

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    const { shiftType, startTime, endTime, isActive } = req.body;

    await shift.update({
      shiftType: shiftType || shift.shiftType,
      startTime: startTime || shift.startTime,
      endTime: endTime || shift.endTime,
      isActive: isActive !== undefined ? isActive : shift.isActive
    });

    const updatedShift = await Shift.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name', 'phone']
      }]
    });

    res.json(updatedShift);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete shift
// @route   DELETE /api/shifts/:id
const deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findByPk(req.params.id);

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    await shift.destroy();
    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get today's shifts
// @route   GET /api/shifts/today
const getTodayShifts = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const shifts = await Shift.findAll({
      where: {
        date: today,
        isActive: true
      },
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name', 'phone', 'isOnDuty', 'currentOrderCount']
      }]
    });

    res.json(shifts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Bulk create shifts
// @route   POST /api/shifts/bulk
const bulkCreateShifts = async (req, res) => {
  try {
    const { shifts } = req.body;

    const createdShifts = await Shift.bulkCreate(shifts, {
      ignoreDuplicates: true
    });

    res.status(201).json(createdShifts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllShifts,
  createShift,
  updateShift,
  deleteShift,
  getTodayShifts,
  bulkCreateShifts
};
