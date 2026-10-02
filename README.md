# 🐾 Paws & Care — Pet Clinic & Shop Management System

A production-oriented MERN stack application for managing a pet clinic and pet care product shop.

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB (local on port 27017 or cloud URI)

### 1. Install & Seed Backend

```bash
cd backend
npm install
npm run seed       # Creates admin + billing manager users, default categories
npm run dev        # Starts on http://localhost:5000
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev        # Starts on http://localhost:5173
```

### 3. Login Credentials

| Role             | Email                      | Password     |
|------------------|---------------------------|--------------|
| Admin            | admin@petclinic.com       | admin123     |
| Billing Manager  | billing@petclinic.com     | billing123   |

---

## 🏗 Architecture

```
Pet-Clinic/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── models/          # Mongoose models
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/       # Auth, error handler
│   │   └── utils/           # PDF generator, seed
│   └── server.js
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── auth/         # Login
        │   ├── dashboard/    # Admin + BM dashboards
        │   ├── clients/      # Client management
        │   ├── pets/         # Pet management
        │   ├── clinic/       # Consultations, treatments, prescriptions
        │   ├── products/     # Products, categories, suppliers
        │   ├── inventory/    # Stock management
        │   ├── purchases/    # Purchase orders
        │   ├── billing/      # New bill, history, invoice PDF
        │   ├── reports/      # Sales reports
        │   └── users/        # User management (Admin only)
        ├── layouts/          # Admin + Billing Manager layouts
        ├── context/          # Auth context
        ├── services/         # Axios API calls
        └── utils/            # Helpers, formatters
```

---

## 🔑 Key Features

### Billing (Most Important)
- Fast product search + cart management
- Per-product GST calculation (not hardcoded)
- Backend-authoritative price recalculation (frontend totals are display-only)
- Inventory deduction ONLY after successful payment
- Unique invoice numbers: `INV-2026-000001`
- Professional PDF invoice via PDFKit (server-side)
- Download PDF + Print

### Inventory Management
- Real-time stock tracking
- Low stock / Out of stock / Expiring Soon / Expired statuses
- Full transaction history (PURCHASE, SALE, CLINIC_USAGE, ADJUSTMENT)
- Stock adjustments with reason
- Batch and expiry tracking

### Patient / Client Management
- Client profiles with pet relationships
- Pet profiles with medical history
- Consultation → Treatment → Prescription flow
- Vaccination records

### Clinic Billing (Internal)
- **No GST** (RULE: Clinic billing = internal record only)
- **No customer invoice** (stored for owner reference)
- Stock deducted for products used during treatment

### Product Shop Billing
- **GST included** (per product rate)
- **Customer invoice generated**
- Walk-in + existing client support
- Optional pet association

---

## 📋 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/clients | List clients |
| POST | /api/clients | Create client |
| GET | /api/pets | List pets |
| POST | /api/pets | Create pet |
| GET | /api/products | List products |
| POST | /api/products | Create product (Admin) |
| GET | /api/inventory | Inventory overview |
| POST | /api/inventory/adjustment | Adjust stock (Admin) |
| POST | /api/purchases | Create purchase (Admin) |
| POST | /api/billing/product | Create product bill |
| GET | /api/billing/product/:id/pdf | Download invoice PDF |
| POST | /api/clinic/billing | Create clinic billing (internal) |
| GET | /api/dashboard/admin | Admin dashboard stats |
| GET | /api/dashboard/billing-manager | Billing Manager stats |

---

## 🛡 Important Business Rules

1. **Clinic billing = NO GST, NO customer invoice** (internal owner reference only)
2. **Product shop = GST applicable, customer invoice generated**
3. **Inventory deducted ONLY after successful payment confirmation**
4. **Backend recalculates all prices/GST** (frontend totals are display only)
5. **Expired products cannot be sold** (backend validates)
6. **Quantity > available stock is prevented** (backend validates)
7. **Invoice numbers never reused** (`INV-YYYY-XXXXXX`)
8. **Bill snapshots preserve historical product data** (old invoices stay accurate)

---

## 🔒 Role Permissions

| Feature | Admin | Billing Manager |
|---------|-------|----------------|
| Create/Edit Products | ✅ | ❌ |
| Create/Edit Clients | ✅ | ✅ |
| Manage Inventory | ✅ | View only |
| Create Purchases | ✅ | ❌ |
| Create Bills | ✅ | ✅ |
| View Billing History | ✅ | ✅ |
| Manage Users | ✅ | ❌ |
| View Reports | ✅ | ❌ |

---

## ⚙️ Environment Variables (backend/.env)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/petclinic
JWT_SECRET=change_this_in_production
JWT_EXPIRE=7d
BUSINESS_NAME=Paws & Care Pet Clinic
BUSINESS_ADDRESS=...
BUSINESS_PHONE=...
BUSINESS_EMAIL=...
BUSINESS_GSTIN=...
```
