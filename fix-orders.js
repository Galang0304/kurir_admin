const { Sequelize } = require('sequelize');

const db = new Sequelize('kurirta', 'postgres', 'galang', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function fix() {
  try {
    // Delete old orders with wrong format
    await db.query(`DELETE FROM "Orders" WHERE "orderNumber" LIKE 'ORD2025%'`);
    console.log('✅ Deleted old orders with wrong format');
    
    // Show remaining orders
    const [orders] = await db.query(`SELECT "orderNumber" FROM "Orders"`);
    console.log('Remaining orders:', orders.length);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

fix();
