const { Order, User, Customer, Shift } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all orders
// @route   GET /api/orders
const getAllOrders = async (req, res) => {
  try {
    const { status, driverId, startDate, endDate } = req.query;
    
    let whereClause = {};
    
    if (status) whereClause.status = status;
    if (driverId) whereClause.driverId = driverId;
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] },
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'driver', attributes: ['id', 'name', 'phone', 'email'] },
        { model: Customer, as: 'customer' }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new order (from WhatsApp Bot)
// @route   POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { customerPhone, customerName, pickupAddress, deliveryAddress, orderDetails, notes } = req.body;

    // Validate required fields
    if (!customerPhone || !customerName) {
      return res.status(400).json({ message: 'Nama dan nomor HP wajib diisi' });
    }

    // Generate unique order number using timestamp + random
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `ORD${timestamp}${random}`;

    // Clean phone number (remove @lid or @c.us suffix and non-numeric)
    let cleanPhone = customerPhone.replace('@lid', '').replace('@c.us', '').replace(/[^0-9]/g, '');
    
    // Validate phone number format
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return res.status(400).json({ message: 'Nomor HP tidak valid' });
    }

    // Find or create customer
    let customer;
    try {
      [customer] = await Customer.findOrCreate({
        where: { phone: cleanPhone },
        defaults: { name: customerName, phone: cleanPhone }
      });
    } catch (err) {
      // If duplicate, just find existing
      customer = await Customer.findOne({ where: { phone: cleanPhone } });
      if (!customer) {
        return res.status(400).json({ message: 'Gagal membuat customer' });
      }
    }

    // Create order
    const order = await Order.create({
      orderNumber,
      customerId: customer.id,
      customerPhone: cleanPhone,
      customerName: customerName || customer.name,
      pickupAddress,
      deliveryAddress,
      orderDetails,
      notes,
      status: 'pending'
    });

    // Update customer order count
    await customer.update({
      totalOrders: customer.totalOrders + 1,
      lastOrderAt: new Date()
    });

    // Auto-assign to available driver
    const assignedOrder = await autoAssignDriver(order.id);

    // Emit socket event for new order
    if (req.io) {
      req.io.emit('newOrder', assignedOrder);
    }

    res.status(201).json(assignedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auto-assign driver to order (MAX 2 orders per driver)
// Logic: Prioritas tinggi dulu, kalau sibuk langsung lempar ke yang tersedia
const autoAssignDriver = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId);
    if (!order || order.status !== 'pending') return order;

    // STEP 1: Cari driver prioritas yang TIDAK SIBUK (order < 2)
    let availableDrivers = await User.findAll({
      where: {
        role: 'driver',
        isActive: true,
        isOnDuty: true,
        isPriority: true,
        currentOrderCount: { [Op.lt]: 2 } // Max 2 orders
      },
      order: [
        ['priorityLevel', 'DESC'],    // Level tertinggi dulu
        ['currentOrderCount', 'ASC'], // Yang paling kosong
      ]
    });

    // STEP 2: Kalau semua driver prioritas sibuk, cari driver biasa
    if (availableDrivers.length === 0) {
      console.log('⚠️ All priority drivers busy, checking regular drivers...');
      availableDrivers = await User.findAll({
        where: {
          role: 'driver',
          isActive: true,
          isOnDuty: true,
          currentOrderCount: { [Op.lt]: 2 }
        },
        order: [
          ['isPriority', 'DESC'],       // Prioritas tetap duluan kalau ada
          ['priorityLevel', 'DESC'],
          ['currentOrderCount', 'ASC'],
          ['totalOrdersCompleted', 'ASC']
        ]
      });
    }

    console.log(`📋 Available drivers: ${availableDrivers.length}`);
    availableDrivers.forEach(d => {
      console.log(`  - ${d.name}: priority=${d.isPriority}, level=${d.priorityLevel}, orders=${d.currentOrderCount}`);
    });

    if (availableDrivers.length > 0) {
      const selectedDriver = availableDrivers[0];
      console.log(`✅ Auto-assigned to: ${selectedDriver.name}`);
      
      await order.update({
        driverId: selectedDriver.id,
        status: 'assigned',
        assignedAt: new Date()
      });

      await selectedDriver.update({
        currentOrderCount: selectedDriver.currentOrderCount + 1
      });

      return await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] },
          { model: Customer, as: 'customer' }
        ]
      });
    }

    console.log('❌ No available drivers - order stays pending');
    return order;
  } catch (error) {
    console.error('Auto-assign error:', error);
    return null;
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updateData = { status };

    switch (status) {
      case 'accepted':
        updateData.acceptedAt = new Date();
        break;
      case 'completed':
        updateData.completedAt = new Date();
        // Update driver stats
        if (order.driverId) {
          const driver = await User.findByPk(order.driverId);
          await driver.update({
            currentOrderCount: Math.max(0, driver.currentOrderCount - 1),
            totalOrdersCompleted: driver.totalOrdersCompleted + 1
          });
        }
        break;
      case 'cancelled':
        updateData.cancelledAt = new Date();
        updateData.cancelReason = cancelReason;
        // Return order count to driver
        if (order.driverId) {
          const driver = await User.findByPk(order.driverId);
          await driver.update({
            currentOrderCount: Math.max(0, driver.currentOrderCount - 1)
          });
        }
        break;
    }

    await order.update(updateData);

    const updatedOrder = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] },
        { model: Customer, as: 'customer' }
      ]
    });

    // Emit socket event untuk dashboard dan WhatsApp bot
    if (req.io) {
      req.io.emit('orderUpdated', updatedOrder);
      // Kirim event khusus untuk notifikasi customer
      req.io.emit('orderStatusUpdate', {
        orderId: updatedOrder.id,
        customerPhone: updatedOrder.customerPhone,
        status: updatedOrder.status,
        cancelReason: updatedOrder.cancelReason
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign order to specific driver
// @route   PUT /api/orders/:id/assign
const assignOrder = async (req, res) => {
  try {
    const { driverId } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const driver = await User.findOne({
      where: { id: driverId, role: 'driver' }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // If order already assigned, decrease previous driver's count
    if (order.driverId) {
      const previousDriver = await User.findByPk(order.driverId);
      await previousDriver.update({
        currentOrderCount: Math.max(0, previousDriver.currentOrderCount - 1)
      });
    }

    await order.update({
      driverId,
      status: 'assigned',
      assignedAt: new Date()
    });

    await driver.update({
      currentOrderCount: driver.currentOrderCount + 1
    });

    const updatedOrder = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] },
        { model: Customer, as: 'customer' }
      ]
    });

    // Emit socket event untuk notifikasi ke customer via WhatsApp Bot
    if (req.io) {
      req.io.emit('orderAssigned', {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        customerPhone: updatedOrder.customerPhone,
        driver: updatedOrder.driver ? {
          name: updatedOrder.driver.name,
          phone: updatedOrder.driver.phone
        } : null
      });
      req.io.emit('orderUpdated', updatedOrder);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get driver's orders
// @route   GET /api/orders/driver/:driverId
const getDriverOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let whereClause = { driverId: req.params.driverId };
    
    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: Customer, as: 'customer' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, pendingOrders, completedToday, activeDrivers] = await Promise.all([
      Order.count(),
      Order.count({ where: { status: 'pending' } }),
      Order.count({
        where: {
          status: 'completed',
          completedAt: { [Op.gte]: today }
        }
      }),
      User.count({
        where: {
          role: 'driver',
          isOnDuty: true,
          isActive: true
        }
      })
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      completedToday,
      activeDrivers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get orders by customer phone (for WhatsApp bot)
// @route   GET /api/orders/customer/:phone
const getOrdersByCustomerPhone = async (req, res) => {
  try {
    let phone = req.params.phone;
    
    // Clean phone number
    phone = phone.replace(/[^0-9]/g, '');
    
    // Normalize phone (08xxx -> 628xxx)
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    console.log('Looking for orders with phone:', phone);

    const orders = await Order.findAll({
      where: { customerPhone: phone },
      include: [
        { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    console.log('Found orders:', orders.length);

    res.json(orders);
  } catch (error) {
    console.error('Error getting orders by phone:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  assignOrder,
  getDriverOrders,
  getOrderStats,
  autoAssignDriver,
  getOrdersByCustomerPhone
};
