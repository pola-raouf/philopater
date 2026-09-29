require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { spawn } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const Analytics = require('../Models/analyticsSchema');
const Order = require('../Models/orderSchema');
const Product = require('../Models/productManagementSchema');
const User = require('../Models/userManagementSchema');

const root = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;
const BASE = `http://localhost:${PORT}`;
const JSON_HEADERS = { Accept: 'application/json' };
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const rows = [];
let child = null;
let spawned = false;

class CookieJar {
  constructor() {
    this.map = new Map();
  }

  absorb(res) {
    const cookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    for (const cookie of cookies) {
      const pair = cookie.split(';')[0];
      const eq = pair.indexOf('=');
      if (eq > 0) {
        this.map.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    }
  }

  header() {
    return [...this.map.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
  }
}

function record(method, endpoint, test, pass, notes, status) {
  rows.push({
    method,
    endpoint,
    test,
    result: pass ? 'pass' : 'fail',
    notes: notes || '',
    status: status === undefined ? '' : String(status)
  });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${method} ${endpoint} — ${test}${status ? ` (${status})` : ''}${notes ? ` · ${notes}` : ''}`);
}

function expectStatus(res, allowed, testName, method, endpoint, extraNotes) {
  const pass = allowed.includes(res.status);
  record(
    method,
    endpoint,
    testName,
    pass,
    extraNotes || (pass ? '' : `expected ${allowed.join('/')}`),
    res.status
  );
  return pass;
}

function notServerError(res, testName, method, endpoint) {
  const pass = res.status !== 500 && res.status < 500;
  record(
    method,
    endpoint,
    testName,
    pass && (res.status === 400 || res.status === 404),
    pass && (res.status === 400 || res.status === 404)
      ? ''
      : `expected 400/404, got ${res.status}`,
    res.status
  );
  return pass && (res.status === 400 || res.status === 404);
}

async function request(jar, url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const cookie = jar.header();
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(url, { ...options, headers, redirect: options.redirect || 'manual' });
  jar.absorb(res);
  return res;
}

async function waitForServer(timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(BASE, { redirect: 'manual' });
      if (res.status) return true;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return false;
}

async function ensureServer() {
  if (await waitForServer(1500)) {
    spawned = false;
    return;
  }
  child = spawn(process.execPath, ['back.js'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  spawned = true;
  child.stdout.on('data', (buf) => process.stdout.write(`[server] ${buf}`));
  child.stderr.on('data', (buf) => process.stderr.write(`[server] ${buf}`));
  const up = await waitForServer(90000);
  if (!up) {
    throw new Error('Server did not become reachable (database connection likely failed)');
  }
}

function stopServer() {
  if (child && !child.killed) {
    child.kill();
  }
}

async function main() {
  const mongoUri = process.env.MONGO_URI || '';
  if (!mongoUri) {
    throw new Error('MONGO_URI missing from environment');
  }
  if (!/\/philopater_db(\?|$)/.test(mongoUri)) {
    throw new Error('MONGO_URI must use database name philopater_db');
  }

  await mongoose.connect(mongoUri);
  const dbName = mongoose.connection.name;
  if (dbName !== 'philopater_db') {
    throw new Error(`Connected to '${dbName}' instead of philopater_db`);
  }
  console.log('DB connection: ok (philopater_db)');

  await ensureServer();

  const jar = new CookieJar();
  const stamp = Date.now().toString(36).slice(-6);
  const username = `c${stamp}`;
  const email = `${username}@crudchk.example`;
  const password = 'Test1234!';
  const productName = `p${stamp}`;
  const country = `z${stamp}`;
  let orderId = null;

  try {
    const created = await request(jar, `${BASE}/insert`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, admin: true })
    });
    expectStatus(created, [200, 201], 'create valid user', 'POST', '/insert');

    const listed = await request(jar, `${BASE}/search`, { headers: JSON_HEADERS });
    const listedBody = await listed.json().catch(() => ({}));
    const listHasUser = Array.isArray(listedBody.users) && listedBody.users.some((u) => u.username === username);
    record('GET', '/search', 'list users includes created user', listed.status === 200 && listHasUser, listHasUser ? '' : 'created user missing from list', listed.status);

    const read = await request(jar, `${BASE}/search?username=${encodeURIComponent(username)}`, { headers: JSON_HEADERS });
    const readBody = await read.json().catch(() => ({}));
    const readOk = read.status === 200 && Array.isArray(readBody.users) && readBody.users.some((u) => u.username === username);
    record('GET', '/search?username=', 'read user by username', readOk, readOk ? '' : 'user not returned', read.status);

    const missingFields = await request(jar, `${BASE}/insert`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    notServerError(missingFields, 'create user missing required fields', 'POST', '/insert');

    const wrongTypes = await request(jar, `${BASE}/insert`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 1, email: 2, password: 3 })
    });
    notServerError(wrongTypes, 'create user wrong types', 'POST', '/insert');

    const login = await request(jar, `${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email, password }).toString()
    });
    record('POST', '/login', 'login test user (session + jwt)', [200, 302].includes(login.status), '', login.status);

    const form = new FormData();
    form.append('name', productName);
    form.append('price', '12.5');
    form.append('country', country);
    form.append('quantity', '7');
    form.append('image', new Blob([PNG], { type: 'image/png' }), 'dot.png');
    const productCreate = await request(jar, `${BASE}/insert_product`, { method: 'POST', body: form });
    expectStatus(productCreate, [200, 201], 'create valid product', 'POST', '/insert_product');

    const productList = await request(jar, `${BASE}/search_product`, { headers: JSON_HEADERS });
    const productListBody = await productList.json().catch(() => ({}));
    const listHasProduct = Array.isArray(productListBody.products) && productListBody.products.some((p) => p.name === productName);
    record('GET', '/search_product', 'list products includes created product', productList.status === 200 && listHasProduct, '', productList.status);

    const productRead = await request(jar, `${BASE}/search_product?query=${encodeURIComponent(productName)}`, { headers: JSON_HEADERS });
    const productReadBody = await productRead.json().catch(() => ({}));
    const productReadOk = productRead.status === 200 && Array.isArray(productReadBody.products) && productReadBody.products.some((p) => p.name === productName);
    record('GET', '/search_product?query=', 'read product by name', productReadOk, '', productRead.status);

    const productUpdate = await request(jar, `${BASE}/update_product`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: productName, newPrice: '15.5', quntity: '4' })
    });
    expectStatus(productUpdate, [200, 201], 'update product', 'POST', '/update_product');

    const productAfter = await request(jar, `${BASE}/search_product?query=${encodeURIComponent(productName)}`, { headers: JSON_HEADERS });
    const afterBody = await productAfter.json().catch(() => ({}));
    const persisted = Array.isArray(afterBody.products) && afterBody.products.some((p) => p.name === productName && Number(p.price) === 15.5);
    record('GET', '/search_product?query=', 'update persisted', persisted, persisted ? '' : 'price not 15.5', productAfter.status);

    const badProduct = await request(jar, `${BASE}/insert_product`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: productName })
    });
    notServerError(badProduct, 'create product missing required fields', 'POST', '/insert_product');

    const badProductId = await request(jar, `${BASE}/update_product`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 99, newPrice: '1' })
    });
    notServerError(badProductId, 'update product wrong productId type', 'POST', '/update_product');

    const cart = await request(jar, `${BASE}/api/update-cart`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart: {
          [productName]: { price: 15.5, quantity: 1, image: '/image/x.png', country }
        }
      })
    });
    expectStatus(cart, [200, 201], 'session cart update', 'POST', '/api/update-cart');

    const purchase = await request(jar, `${BASE}/api/purchase`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalPrice: 15.5, paymentMethod: 'card' })
    });
    expectStatus(purchase, [200, 201], 'create order (purchase)', 'POST', '/api/purchase');

    const listedOrders = await request(jar, `${BASE}/api/orders?username=${encodeURIComponent(username)}`, { headers: JSON_HEADERS });
    const ordersBody = await listedOrders.json().catch(() => ({}));
    const createdOrder = Array.isArray(ordersBody.orders) && ordersBody.orders[0];
    orderId = createdOrder ? createdOrder._id : null;
    record('GET', '/api/orders?username=', 'list orders for test user', listedOrders.status === 200 && Boolean(orderId), orderId ? '' : 'no order returned', listedOrders.status);

    if (orderId) {
      const orderRead = await request(jar, `${BASE}/api/orders/${orderId}`, { headers: JSON_HEADERS });
      const orderReadBody = await orderRead.json().catch(() => ({}));
      record('GET', '/api/orders/:id', 'read order by id', orderRead.status === 200 && orderReadBody._id, '', orderRead.status);

      const orderUpdate = await request(jar, `${BASE}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'cash' })
      });
      expectStatus(orderUpdate, [200, 201], 'update order', 'PUT', '/api/orders/:id');

      const orderAfter = await request(jar, `${BASE}/api/orders/${orderId}`, { headers: JSON_HEADERS });
      const orderAfterBody = await orderAfter.json().catch(() => ({}));
      record('GET', '/api/orders/:id', 'order update persisted', orderAfter.status === 200 && orderAfterBody.paymentMethod === 'cash', '', orderAfter.status);
    } else {
      record('GET', '/api/orders/:id', 'read order by id', false, 'create did not yield an id');
      record('PUT', '/api/orders/:id', 'update order', false, 'skipped');
    }

    const badOrderId = await request(jar, `${BASE}/api/orders/not-an-objectid`, { headers: JSON_HEADERS });
    notServerError(badOrderId, 'read order bad ObjectId', 'GET', '/api/orders/:id');

    const missingOrder = await request(jar, `${BASE}/api/orders/000000000000000000000000`, { headers: JSON_HEADERS });
    notServerError(missingOrder, 'read order missing id', 'GET', '/api/orders/:id');

    const emptyCartPurchase = await request(jar, `${BASE}/api/purchase`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalPrice: 1, paymentMethod: 'card' })
    });
    notServerError(emptyCartPurchase, 'purchase with empty cart', 'POST', '/api/purchase');

    const analytics = await request(jar, `${BASE}/api/analytics-data`, { headers: JSON_HEADERS });
    record('GET', '/api/analytics-data', 'read analytics (admin jwt)', analytics.status === 200, analytics.status === 401 || analytics.status === 403 ? 'auth rejected' : '', analytics.status);

    const analyticsAnon = new CookieJar();
    const analyticsNoAuth = await request(analyticsAnon, `${BASE}/api/analytics-data`, { headers: JSON_HEADERS });
    record('GET', '/api/analytics-data', 'analytics without token is 401/403 not 500', analyticsNoAuth.status === 401 || analyticsNoAuth.status === 403, '', analyticsNoAuth.status);

    const userUpdate = await request(jar, `${BASE}/update`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email: `upd-${email}` })
    });
    expectStatus(userUpdate, [200, 201], 'update user email', 'POST', '/update');

    const userAfter = await request(jar, `${BASE}/search?username=${encodeURIComponent(username)}`, { headers: JSON_HEADERS });
    const userAfterBody = await userAfter.json().catch(() => ({}));
    const emailOk = Array.isArray(userAfterBody.users) && userAfterBody.users.some((u) => u.email === `upd-${email}`);
    record('GET', '/search?username=', 'user update persisted', userAfter.status === 200 && emailOk, '', userAfter.status);

    const badUserUpdate = await request(jar, `${BASE}/update`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 1, email: 'x@y.z' })
    });
    notServerError(badUserUpdate, 'update user wrong username type', 'POST', '/update');

    if (orderId) {
      const orderDelete = await request(jar, `${BASE}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: JSON_HEADERS
      });
      expectStatus(orderDelete, [200, 201], 'delete order', 'DELETE', '/api/orders/:id');
      const orderGone = await request(jar, `${BASE}/api/orders/${orderId}`, { headers: JSON_HEADERS });
      record('GET', '/api/orders/:id', 'follow-up read after delete is 404', orderGone.status === 404, '', orderGone.status);
      orderId = null;
    } else {
      record('DELETE', '/api/orders/:id', 'delete order', false, 'skipped');
    }

    const productDelete = await request(jar, `${BASE}/delete_product`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productname: productName })
    });
    expectStatus(productDelete, [200, 201], 'delete product', 'POST', '/delete_product');
    const productGone = await request(jar, `${BASE}/search_product?query=${encodeURIComponent(productName)}`, { headers: JSON_HEADERS });
    record('GET', '/search_product?query=', 'follow-up product read after delete is 404', productGone.status === 404, '', productGone.status);

    const userDelete = await request(jar, `${BASE}/delete`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    expectStatus(userDelete, [200, 201], 'delete user', 'POST', '/delete');
    const userGone = await request(jar, `${BASE}/search?username=${encodeURIComponent(username)}`, { headers: JSON_HEADERS });
    record('GET', '/search?username=', 'follow-up user read after delete is 404', userGone.status === 404, '', userGone.status);

    const missingDelete = await request(jar, `${BASE}/delete`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    notServerError(missingDelete, 'delete missing user', 'POST', '/delete');

    const missingProductDelete = await request(jar, `${BASE}/delete_product`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productname: productName })
    });
    notServerError(missingProductDelete, 'delete missing product', 'POST', '/delete_product');
  } finally {
    await Order.deleteMany({ username: new RegExp(`^c${stamp}$`) });
    if (orderId) {
      await Order.deleteOne({ _id: orderId });
    }
    await Product.deleteMany({ name: productName });
    await User.deleteMany({ username });
    await Analytics.deleteMany({ country: country.toLowerCase() });
    await mongoose.disconnect();
    if (spawned) stopServer();
  }

  const failed = rows.filter((row) => row.result === 'fail');
  console.log(`\n${rows.length - failed.length}/${rows.length} checks passed`);
  if (failed.length) {
    process.exitCode = 1;
  }
  return rows;
}

main().catch((err) => {
  console.error(err.message);
  stopServer();
  process.exit(1);
});
