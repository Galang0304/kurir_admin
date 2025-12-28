const User = require('./User');
const Customer = require('./Customer');
const Order = require('./Order');
const Shift = require('./Shift');

// Define associations
User.hasMany(Order, { foreignKey: 'driverId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Shift, { foreignKey: 'driverId', as: 'shifts' });
Shift.belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

module.exports = {
  User,
  Customer,
  Order,
  Shift
};
