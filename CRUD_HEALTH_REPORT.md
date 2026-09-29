# CRUD Health Report — Philopater Backend

**Date:** 2026-09-29  
**Node/Express version:** Express 5.x  
**Mongoose version:** ^8.14.3  
**DB connection status:** Connected (philopater_db)  
**Test result:** 35/35 checks passed

---

## Environment

| Variable       | Status                                      |
|----------------|---------------------------------------------|
| `MONGO_URI`    | Present — points to `philopater_db`       |
| `PORT`         | Present (5000)                          |
| `JWT_SECRET`   | Present                                   |
| `.env`         | Listed in `.gitignore`                    |
| `.env.example` | Present with placeholder values           |

---

## Models

| Model file                          | Model name | Key required fields                              |
|-------------------------------------|------------|--------------------------------------------------|
| Models/userManagementSchema.js      | User       | username, email, password                        |
| Models/productManagementSchema.js   | Product    | name, price, country, image, unitsLeft           |
| Models/orderSchema.js               | Order      | userId, username                                 |
| Models/analyticsSchema.js           | Analytics  | country (unique)                                 |
| Models/Company.js                   | Company    | name                                             |
| Models/Product.js                   | Product    | name, company, price, image (legacy)             |

> **Note:** `Models/Product.js` and `Models/productManagementSchema.js` both register the Mongoose model
> named `Product`. `productManagementSchema.js` guards with `mongoose.models.Product || mongoose.model(...)`,
> so whichever is loaded first wins. In the current route registration order, `productManagementSchema.js`
> always loads first — `category.js` controller receives the already-registered management schema.
> This is safe at runtime but is a confusing architecture smell (see Remaining Issues).

---

## Endpoint Table

| Method | Endpoint                 | Test performed                               | Result | Status | Notes |
|--------|--------------------------|----------------------------------------------|--------|--------|-------|
| POST   | /insert                  | Create user with valid data                  | pass   | 201    |       |
| GET    | /search                  | List all users, confirm created user appears | pass   | 200    |       |
| GET    | /search?username=        | Read user by username                        | pass   | 200    |       |
| POST   | /insert                  | Create user — missing required fields        | pass   | 400    | returns {error} |
| POST   | /insert                  | Create user — wrong types (numbers)          | pass   | 400    |       |
| POST   | /login                   | Session + JWT login for test user            | pass   | 302    |       |
| POST   | /update                  | Update user email                            | pass   | 200    |       |
| GET    | /search?username=        | Update persisted (email changed)             | pass   | 200    |       |
| POST   | /update                  | Update user — wrong username type            | pass   | 400    |       |
| POST   | /delete                  | Delete user by username                      | pass   | 200    |       |
| GET    | /search?username=        | Follow-up read after delete -> 404           | pass   | 404    |       |
| POST   | /delete                  | Delete missing user -> 404                   | pass   | 404    |       |
| POST   | /insert_product          | Create product with valid data + image       | pass   | 201    | multipart/form-data |
| GET    | /search_product          | List all products, confirm product appears   | pass   | 200    |       |
| GET    | /search_product?query=   | Read product by name                         | pass   | 200    |       |
| POST   | /update_product          | Update product price + quantity              | pass   | 200    | JSON body |
| GET    | /search_product?query=   | Update persisted (price = 15.5)              | pass   | 200    |       |
| POST   | /insert_product          | Create product — missing required fields     | pass   | 400    |       |
| POST   | /update_product          | Update product — wrong productId type        | pass   | 400    |       |
| POST   | /delete_product          | Delete product by name                       | pass   | 200    |       |
| GET    | /search_product?query=   | Follow-up read after delete -> 404           | pass   | 404    |       |
| POST   | /delete_product          | Delete missing product -> 404                | pass   | 404    |       |
| POST   | /api/update-cart         | Session cart update                          | pass   | 200    |       |
| POST   | /api/purchase            | Create order (purchase from cart)            | pass   | 201    |       |
| GET    | /api/orders?username=    | List orders for test user                    | pass   | 200    |       |
| GET    | /api/orders/:id          | Read order by id                             | pass   | 200    |       |
| PUT    | /api/orders/:id          | Update order paymentMethod                   | pass   | 200    |       |
| GET    | /api/orders/:id          | Update persisted (paymentMethod=cash)        | pass   | 200    |       |
| GET    | /api/orders/:id          | Bad ObjectId -> 400, not 500                 | pass   | 400    |       |
| GET    | /api/orders/:id          | Missing id (all-zeros) -> 404                | pass   | 404    |       |
| POST   | /api/purchase            | Purchase with empty cart -> 400              | pass   | 400    |       |
| DELETE | /api/orders/:id          | Delete order by id                           | pass   | 200    |       |
| GET    | /api/orders/:id          | Follow-up read after delete -> 404           | pass   | 404    |       |
| GET    | /api/analytics-data      | Read analytics (admin JWT cookie)            | pass   | 200    |       |
| GET    | /api/analytics-data      | No token -> 401 not 500                      | pass   | 401    |       |

---

## Fixes Made

### Fix 1 — controller/product_controller.js: Wrong status code on product creation

**Problem:** insertProduct returned res.status(200) after product.save().
A successful resource creation must return 201 Created.

```diff
-    res.status(200).json({ success: true, message: 'Product inserted successfully' });
+    res.status(201).json({ success: true, message: 'Product inserted successfully' });
```

### Fix 2 — .env.example: Leaking partial credentials and missing DB name in URI

**Problem:** The example file contained the real hostname and a nearly-real username,
and the URI was missing the required database path segment `philopater_db`.

```diff
-MONGO_URI=mongodb+srv://<user>:<password>@<host>/?appName=philopater-cluster
+MONGO_URI=mongodb+srv://<user>:<password>@<host>/philopater_db?appName=philopater-cluster
```

### Fix 3 — controller/analyticsController.js: Unhandled promise rejection at module load

**Problem:** initializeAnalytics() was called at the top level without .catch().
If the DB connection is temporarily unavailable when the module is first loaded, this
produces an uncaught Promise rejection that can crash the process in Node 18+.

```diff
-initializeAnalytics();
+initializeAnalytics().catch((err) => console.error('Analytics init error:', err.message));
```

---

## Remaining Issues (non-blocking)

| # | Severity | Description |
|---|----------|-------------|
| 1 | Medium   | Dual `Product` model files. Models/Product.js (legacy) and Models/productManagementSchema.js (current) both register the Mongoose model `Product`. The guard prevents a crash but Models/Product.js should be retired or renamed. |
| 2 | Low      | controller/analyticsController.js is never imported by any route — its seeding logic is dead code. Analytics are seeded inline in routes/order.js instead. |
| 3 | Low      | .gitignore lists `.env` twice (lines 3 and 5). Harmless but untidy. |
| 4 | Low      | routes/order.js reset-analytics route calls deleteMany({}) on the Analytics collection. Guarded by admin JWT, but a leaked admin token could wipe all analytics. Consider adding an explicit confirmation param. |
| 5 | Info     | routes/signinroute.js exists in routes/ but is never mounted in back.js. Verify it can be removed. |

---

## How to Re-run the Tests

### Prerequisites

1. Ensure `.env` is present with a valid `MONGO_URI` pointing to `philopater_db`.
2. Install dependencies: `npm install`

### Run

```bash
npm run test:crud
```

The script (tests/crud-check.js) will:

1. Verify MONGO_URI targets philopater_db.
2. Connect directly to the database to set up and tear down test documents.
3. Auto-start the server (back.js) if one is not already listening on PORT.
4. Execute 35 CRUD checks across Users, Products, Orders, and Analytics.
5. Clean up every document it creates — no permanent changes to existing data.
6. Exit with code 0 on full pass, 1 if any check fails.

### Expected output

```
35/35 checks passed
```
