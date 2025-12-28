const { sequelize, connectDB } = require('./config/database');
const { User } = require('./models');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin exists
    const adminExists = await User.findOne({ where: { email: 'admin@kurirta.com' } });
    
    if (adminExists) {
      console.log('Admin already exists!');
    } else {
      // Create admin user
      await User.create({
        name: 'Admin KurirTA',
        email: 'admin@kurirta.com',
        password: 'admin123',
        phone: '081234567890',
        role: 'admin',
        isActive: true
      });
      console.log('✅ Admin created successfully!');
      console.log('Email: admin@kurirta.com');
      console.log('Password: admin123');
    }

    // Create sample drivers
    const drivers = [
      { name: 'Driver Andi', email: 'andi@kurirta.com', password: 'driver123', phone: '081111111111' },
      { name: 'Driver Budi', email: 'budi@kurirta.com', password: 'driver123', phone: '082222222222' },
      { name: 'Driver Citra', email: 'citra@kurirta.com', password: 'driver123', phone: '083333333333' }
    ];

    for (const driver of drivers) {
      const exists = await User.findOne({ where: { email: driver.email } });
      if (!exists) {
        await User.create({
          ...driver,
          role: 'driver',
          isActive: true,
          isOnDuty: true,
          priorityLevel: Math.floor(Math.random() * 5) + 1
        });
        console.log(`✅ Driver ${driver.name} created!`);
      }
    }

    console.log('\n🎉 Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedAdmin();
