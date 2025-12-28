const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('kurirta', 'postgres', 'galang', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function cleanup() {
  try {
    console.log('🧹 Cleaning up invalid data...');
    
    // Delete orders with invalid phone numbers (too long or doesn't start with 628)
    const [ordersDeleted] = await sequelize.query(
      `DELETE FROM "Orders" WHERE LENGTH("customerPhone") > 14 OR "customerPhone" NOT LIKE '628%' RETURNING id`
    );
    console.log(`✅ Deleted ${ordersDeleted.length} orders with invalid phone numbers`);
    
    // Delete customers with invalid phone numbers
    const [customersDeleted] = await sequelize.query(
      `DELETE FROM "Customers" WHERE LENGTH("phone") > 14 OR "phone" NOT LIKE '628%' RETURNING id`
    );
    console.log(`✅ Deleted ${customersDeleted.length} customers with invalid phone numbers`);
    
    console.log('🎉 Cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanup();
