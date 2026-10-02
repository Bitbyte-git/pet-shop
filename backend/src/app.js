const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const petRoutes = require('./routes/pet.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const supplierRoutes = require('./routes/supplier.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const clinicRoutes = require('./routes/clinic.routes');
const billingRoutes = require('./routes/billing.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://pet-shop-bice-two.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      /\.onrender\.com$/.test(origin)
    ) {
      return callback(null, true);
    }
    
    // Allow all origins by default so cross-origin deployments don't fail
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes (Mounted both with and without /api for Vercel/Render flexibility)
const mountRoutes = (pathPrefix) => {
  app.use(`${pathPrefix}/auth`, authRoutes);
  app.use(`${pathPrefix}/clients`, clientRoutes);
  app.use(`${pathPrefix}/pets`, petRoutes);
  app.use(`${pathPrefix}/products`, productRoutes);
  app.use(`${pathPrefix}/categories`, categoryRoutes);
  app.use(`${pathPrefix}/suppliers`, supplierRoutes);
  app.use(`${pathPrefix}/purchases`, purchaseRoutes);
  app.use(`${pathPrefix}/inventory`, inventoryRoutes);
  app.use(`${pathPrefix}/clinic`, clinicRoutes);
  app.use(`${pathPrefix}/billing`, billingRoutes);
  app.use(`${pathPrefix}/prescriptions`, prescriptionRoutes);
  app.use(`${pathPrefix}/users`, userRoutes);
  app.use(`${pathPrefix}/dashboard`, dashboardRoutes);
};

mountRoutes('/api');
mountRoutes('');

// Health check
app.get(['/api/health', '/health', '/'], (req, res) => {
  res.json({ status: 'OK', message: 'Pet Clinic API is running', timestamp: new Date() });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
