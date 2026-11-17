require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const products = [
  { name: 'Wireless Mouse', sku: 'ELEC-MS-101', category: 'Electronics', price: 799, quantity: 30, reorderLevel: 10, supplier: 'Logitech India' },
  { name: 'Bluetooth Speaker', sku: 'ELEC-SP-204', category: 'Electronics', price: 2499, quantity: 25, reorderLevel: 8, supplier: 'boAt' },
  { name: 'Laptop 15 inch', sku: 'ELEC-LP-330', category: 'Electronics', price: 54999, quantity: 4, reorderLevel: 5, supplier: 'Dell India' },
  { name: 'Cotton T-Shirt', sku: 'APRL-TS-501', category: 'Apparel', price: 599, quantity: 50, reorderLevel: 15, supplier: 'Allen Solly' },
  { name: 'Denim Jeans', sku: 'APRL-JN-512', category: 'Apparel', price: 1999, quantity: 28, reorderLevel: 10, supplier: "Levi's" },
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-820', category: 'Furniture', price: 6499, quantity: 3, reorderLevel: 5, supplier: 'Godrej Interio' },
  { name: 'Bookshelf', sku: 'FURN-BS-833', category: 'Furniture', price: 4599, quantity: 12, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Gel Pen Pack of 15', sku: 'STNY-PN-713', category: 'Stationery', price: 120, quantity: 40, reorderLevel: 20, supplier: 'Cello Pens' },
  { name: 'A4 Notebook Pack', sku: 'STNY-NB-720', category: 'Stationery', price: 250, quantity: 35, reorderLevel: 15, supplier: 'Classmate' },
  { name: 'Permanent Marker Set', sku: 'STNY-MK-731', category: 'Stationery', price: 180, quantity: 8, reorderLevel: 15, supplier: 'Camlin' },
  { name: 'Electric Kettle', sku: 'KTCH-KT-901', category: 'Kitchen', price: 1299, quantity: 20, reorderLevel: 6, supplier: 'Prestige' },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
