// routes/sse.js
const express = require('express');
const router = express.Router();

// 🔴 قائمة العملاء المتصلين
let clients = [];

router.get('/events', (req, res) => {
  // إعداد headers
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });

  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  console.log(`✅ New SSE client connected: ${clientId}`);

  // رسالة ترحيب
  res.write(`data: Connected to server\n\n`);

  // عندما يغلق العميل الاتصال
  req.on('close', () => {
    console.log(`❌ SSE client disconnected: ${clientId}`);
    clients = clients.filter(c => c.id !== clientId);
  });
});

// ✅ دالة لإرسال رسالة مخصصة لكل العملاء
function sendToAllClients(message) {
  clients.forEach(client => {
    client.res.write(`data: ${message}\n\n`);
  });
}

// ✅ دالة خاصة لتحديث المنتجات
function sendProductRefreshEvent() {
  sendToAllClients("refresh-products");
}

module.exports = {
  router,
  sendProductRefreshEvent
};
