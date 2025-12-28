const { User, Order, Shift, Customer } = require('../models');
const { Op } = require('sequelize');

// Helper: Auto-assign pending orders ke driver yang baru ON
const assignPendingOrders = async (driver, io) => {
  if (!driver.isOnDuty || !driver.isActive) return;
  if (driver.currentOrderCount >= 2) return; // Already full
  
  // Cari order pending (belum ada driver)
  const pendingOrders = await Order.findAll({
    where: { 
      status: 'pending',
      driverId: null
    },
    order: [['createdAt', 'ASC']], // FIFO - order lama dulu
    limit: 2 - driver.currentOrderCount // Ambil sesuai slot kosong
  });
  
  for (const order of pendingOrders) {
    if (driver.currentOrderCount >= 2) break;
    
    await order.update({
      driverId: driver.id,
      status: 'assigned',
      assignedAt: new Date()
    });
    
    driver.currentOrderCount += 1;
    await driver.save();
    
    console.log(`✅ Auto-assigned order ${order.orderNumber} to ${driver.name}`);
    
    // Emit socket event untuk notifikasi
    if (io) {
      const updatedOrder = await Order.findByPk(order.id, {
        include: [
          { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] },
          { model: Customer, as: 'customer' }
        ]
      });
      
      io.emit('orderAssigned', {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        customerPhone: updatedOrder.customerPhone,
        driver: {
          name: driver.name,
          phone: driver.phone
        }
      });
      io.emit('orderUpdated', updatedOrder);
    }
  }
  
  return pendingOrders.length;
};

// @desc    Get all drivers
// @route   GET /api/drivers
const getAllDrivers = async (req, res) => {
  try {
    const drivers = await User.findAll({
      where: { role: 'driver' },
      attributes: { exclude: ['password'] },
      order: [['priorityLevel', 'DESC'], ['currentOrderCount', 'ASC']]
    });
    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get driver by ID
// @route   GET /api/drivers/:id
const getDriverById = async (req, res) => {
  try {
    const driver = await User.findOne({
      where: { id: req.params.id, role: 'driver' },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Order,
          as: 'orders',
          limit: 10,
          order: [['createdAt', 'DESC']]
        },
        {
          model: Shift,
          as: 'shifts',
          where: {
            date: {
              [Op.gte]: new Date()
            }
          },
          required: false
        }
      ]
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update driver
// @route   PUT /api/drivers/:id
const updateDriver = async (req, res) => {
  try {
    const driver = await User.findOne({
      where: { id: req.params.id, role: 'driver' }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const { name, phone, isActive, isOnDuty, isPriority, priorityLevel } = req.body;
    const wasOnDuty = driver.isOnDuty;

    await driver.update({
      name: name || driver.name,
      phone: phone || driver.phone,
      isActive: isActive !== undefined ? isActive : driver.isActive,
      isOnDuty: isOnDuty !== undefined ? isOnDuty : driver.isOnDuty,
      isPriority: isPriority !== undefined ? isPriority : driver.isPriority,
      priorityLevel: priorityLevel || driver.priorityLevel
    });

    // Kalau driver baru ON, cek dan assign pending orders
    if (!wasOnDuty && driver.isOnDuty) {
      await assignPendingOrders(driver, req.io);
    }

    res.json({
      ...driver.toJSON(),
      password: undefined
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Toggle driver duty status
// @route   PUT /api/drivers/:id/duty
const toggleDuty = async (req, res) => {
  try {
    const driver = await User.findOne({
      where: { id: req.params.id, role: 'driver' }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const wasOnDuty = driver.isOnDuty;
    
    await driver.update({
      isOnDuty: !driver.isOnDuty
    });

    // Kalau driver baru ON, cek dan assign pending orders
    if (!wasOnDuty && driver.isOnDuty) {
      const assigned = await assignPendingOrders(driver, req.io);
      console.log(`📦 ${assigned || 0} pending orders assigned to ${driver.name}`);
    }

    res.json({
      id: driver.id,
      isOnDuty: driver.isOnDuty,
      message: driver.isOnDuty ? 'Driver is now on duty' : 'Driver is now off duty'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get available drivers (on duty with lowest order count)
// @route   GET /api/drivers/available
const getAvailableDrivers = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const drivers = await User.findAll({
      where: {
        role: 'driver',
        isActive: true,
        isOnDuty: true
      },
      attributes: { exclude: ['password'] },
      include: [{
        model: Shift,
        as: 'shifts',
        where: {
          date: today,
          isActive: true
        },
        required: false
      }],
      order: [
        ['isPriority', 'DESC'],
        ['priorityLevel', 'DESC'],
        ['currentOrderCount', 'ASC']
      ]
    });

    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
const deleteDriver = async (req, res) => {
  try {
    const driver = await User.findOne({
      where: { id: req.params.id, role: 'driver' }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    await driver.destroy();
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllDrivers,
  getDriverById,
  updateDriver,
  toggleDuty,
  getAvailableDrivers,
  deleteDriver
};
