require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const ProductCategory = require('../models/ProductCategory');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

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

  // Create sample products
  await Product.deleteMany({});
  const products = [
    {
      productCode: 'MED-001',
      name: 'Ivermectin 1% Solution',
      category: createdCats.find(c => c.prefix === 'MED')._id,
      brand: 'VetCare',
      description: 'Antiparasitic medication for dogs and cats',
      supplier: supplier._id,
      purchasePrice: 250,
      sellingPrice: 350,
      mrp: 400,
      gstRate: 12,
      hsnCode: '3004',
      currentStock: 50,
      reorderLevel: 10,
      batchNumber: 'BATCH-2026-001',
      manufacturingDate: new Date('2025-01-15'),
      expiryDate: new Date('2027-01-15'),
      status: 'ACTIVE',
      createdBy: admin._id,
    },
    {
      productCode: 'FOOD-001',
      name: 'Premium Dog Food - Chicken',
      category: createdCats.find(c => c.prefix === 'FOOD')._id,
      brand: 'PetLife',
      description: 'High protein dog food for adult dogs',
      supplier: supplier._id,
      purchasePrice: 800,
      sellingPrice: 1200,
      mrp: 1350,
      gstRate: 18,
      hsnCode: '2309',
      currentStock: 30,
      reorderLevel: 15,
      batchNumber: 'BATCH-2026-002',
      manufacturingDate: new Date('2025-06-01'),
      expiryDate: new Date('2026-06-01'),
      status: 'ACTIVE',
      createdBy: admin._id,
    },
    {
      productCode: 'GRM-001',
      name: 'Pet Shampoo - Anti-Tick',
      category: createdCats.find(c => c.prefix === 'GRM')._id,
      brand: 'CleanPaws',
      description: 'Anti-tick and flea shampoo for pets',
      supplier: supplier._id,
      purchasePrice: 180,
      sellingPrice: 280,
      mrp: 320,
      gstRate: 18,
      hsnCode: '3305',
      currentStock: 40,
      reorderLevel: 10,
      batchNumber: 'BATCH-2026-003',
      manufacturingDate: new Date('2025-03-01'),
      expiryDate: new Date('2027-03-01'),
      status: 'ACTIVE',
      createdBy: admin._id,
    },
    {
      productCode: 'ACC-001',
      name: 'Dog Collar - Leather',
      category: createdCats.find(c => c.prefix === 'ACC')._id,
      brand: 'PetGear',
      description: 'Durable leather collar for medium to large dogs',
      supplier: supplier._id,
      purchasePrice: 150,
      sellingPrice: 250,
      mrp: 300,
      gstRate: 18,
      hsnCode: '4201',
      currentStock: 25,
      reorderLevel: 10,
      batchNumber: 'BATCH-2026-004',
      manufacturingDate: new Date('2025-04-01'),
      expiryDate: null,
      status: 'ACTIVE',
      createdBy: admin._id,
    },
    {
      productCode: 'VAC-001',
      name: 'Rabies Vaccine',
      category: createdCats.find(c => c.prefix === 'VAC')._id,
      brand: 'VaxPro',
      description: 'Annual rabies vaccination for dogs and cats',
      supplier: supplier._id,
      purchasePrice: 120,
      sellingPrice: 200,
      mrp: 250,
      gstRate: 12,
      hsnCode: '3002',
      currentStock: 20,
      reorderLevel: 5,
      batchNumber: 'BATCH-2026-005',
      manufacturingDate: new Date('2025-02-01'),
      expiryDate: new Date('2026-02-01'),
      status: 'ACTIVE',
      createdBy: admin._id,
    },
    {
      productCode: 'SUP-001',
      name: 'Calcium Supplement',
      category: createdCats.find(c => c.prefix === 'SUP')._id,
      brand: 'BoneHealth',
      description: 'Calcium supplement for strong bones and teeth',
      supplier: supplier._id,
      purchasePrice: 200,
      sellingPrice: 320,
      mrp: 380,
      gstRate: 18,
      hsnCode: '3004',
      currentStock: 35,
      reorderLevel: 10,
      batchNumber: 'BATCH-2026-006',
      manufacturingDate: new Date('2025-05-01'),
      expiryDate: new Date('2027-05-01'),
      status: 'ACTIVE',
      createdBy: admin._id,
    },
    {
      productCode: 'DWR-001',
      name: 'Deworming Tablets',
      category: createdCats.find(c => c.prefix === 'DWR')._id,
      brand: 'VetCare',
      description: 'Broad spectrum dewormer for pets',
      supplier: supplier._id,
      purchasePrice: 150,
      sellingPrice: 250,
      mrp: 300,
      gstRate: 12,
      hsnCode: '3004',
      currentStock: 45,
      reorderLevel: 10,
      batchNumber: 'BATCH-2026-007',
      manufacturingDate: new Date('2025-01-20'),
      expiryDate: new Date('2027-01-20'),
      status: 'ACTIVE',
      createdBy: admin._id,
    },
    {
      productCode: 'FLT-001',
      name: 'Flea & Tick Collar',
      category: createdCats.find(c => c.prefix === 'FLT')._id,
      brand: 'SafeGuard',
      description: '8-month protection against fleas and ticks',
      supplier: supplier._id,
      purchasePrice: 350,
      sellingPrice: 550,
      mrp: 650,
      gstRate: 18,
      hsnCode: '3006',
      currentStock: 22,
      reorderLevel: 8,
      batchNumber: 'BATCH-2026-008',
      manufacturingDate: new Date('2025-07-01'),
      expiryDate: new Date('2026-07-01'),
      status: 'ACTIVE',
      createdBy: admin._id,
    },
    {
      productCode: 'FOOD-002',
      name: 'Cat Food - Salmon',
      category: createdCats.find(c => c.prefix === 'FOOD')._id,
      brand: 'PetLife',
      description: 'Premium salmon formula for adult cats',
      supplier: supplier._id,
      purchasePrice: 450,
      sellingPrice: 700,
      mrp: 800,
      gstRate: 18,
      hsnCode: '2309',
      currentStock: 28,
      reorderLevel: 12,
      batchNumber: 'BATCH-2026-009',
      manufacturingDate: new Date('2025-05-15'),
      expiryDate: new Date('2026-05-15'),
      status: 'ACTIVE',
      createdBy: admin._id,
    },
    {
      productCode: 'MED-002',
      name: 'Antibiotic Tablets',
      category: createdCats.find(c => c.prefix === 'MED')._id,
      brand: 'VetCare',
      description: 'Broad spectrum antibiotic for bacterial infections',
      supplier: supplier._id,
      purchasePrice: 180,
      sellingPrice: 300,
      mrp: 350,
      gstRate: 12,
      hsnCode: '3004',
      currentStock: 15,
      reorderLevel: 5,
      batchNumber: 'BATCH-2026-010',
      manufacturingDate: new Date('2025-03-15'),
      expiryDate: new Date('2026-09-15'),
      status: 'ACTIVE',
      createdBy: admin._id,
    },
  ];

  const createdProducts = await Product.insertMany(products);
  console.log(`Created ${createdProducts.length} sample products`);

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
