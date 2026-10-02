require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const ProductCategory = require('../models/ProductCategory');
const Supplier = require('../models/Supplier');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing users
  await User.deleteMany({});
  console.log('Cleared users');

  // Create Admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@petclinic.com',
    phone: '9876543210',
    password: 'admin123',
    role: 'ADMIN',
    status: 'ACTIVE',
  });
  console.log('Created Admin:', admin.email);

  // Create Billing Manager
  const bm = await User.create({
    name: 'Billing Manager',
    email: 'billing@petclinic.com',
    phone: '9876543211',
    password: 'billing123',
    role: 'BILLING_MANAGER',
    status: 'ACTIVE',
  });
  console.log('Created Billing Manager:', bm.email);

  // Create default categories
  const categories = [
    { name: 'Medicines & Tablets', prefix: 'MED', description: 'Veterinary medicines and tablets' },
    { name: 'Pet Food', prefix: 'FOOD', description: 'Pet food products' },
    { name: 'Grooming Products', prefix: 'GRM', description: 'Pet grooming products' },
    { name: 'Accessories', prefix: 'ACC', description: 'Pet accessories' },
    { name: 'Vaccines', prefix: 'VAC', description: 'Veterinary vaccines' },
    { name: 'Supplements', prefix: 'SUP', description: 'Health supplements' },
    { name: 'Dewormers', prefix: 'DWR', description: 'Deworming products' },
    { name: 'Flea & Tick', prefix: 'FLT', description: 'Flea and tick prevention' },
  ];

  await ProductCategory.deleteMany({});
  const createdCats = await ProductCategory.insertMany(categories.map((c) => ({ ...c, createdBy: admin._id })));
  console.log(`Created ${createdCats.length} categories`);

  // Create default supplier
  await Supplier.deleteMany({});
  const supplier = await Supplier.create({
    name: 'Pet Pharma Distributors',
    contactPerson: 'Suresh Kumar',
    mobile: '9876500001',
    email: 'petpharma@example.com',
    address: 'Wholesale Market, Chennai',
    createdBy: admin._id,
  });
  console.log('Created supplier:', supplier.name);

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────────────────');
  console.log('Admin Login:          admin@petclinic.com / admin123');
  console.log('Billing Manager Login: billing@petclinic.com / billing123');
  console.log('─────────────────────────────────────────');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
