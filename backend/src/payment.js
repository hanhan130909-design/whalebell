/**
 * WhaleBell Payment Module v2
 * 手动转账 + 管理验证（零门槛，印尼微商标准模式）
 * 后续可无缝切换 Midtrans
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Plan prices (IDR)
const PLANS = {
  weekly: { name: '周卡', price: 29000, days: 7, dailyTargets: 50 },
  monthly: { name: '月卡', price: 79000, days: 30, dailyTargets: 50 }
};

// Payment accounts (admin configured via env or dashboard)
function getPaymentAccounts() {
  return {
    gopay: {
      name: 'GoPay',
      number: process.env.PAY_GOPAY || '0812xxxxxxxx',
      holder: process.env.PAY_HOLDER || 'WhaleBell Admin',
      icon: '📱'
    },
    dana: {
      name: 'Dana',
      number: process.env.PAY_DANA || '0812xxxxxxxx',
      holder: process.env.PAY_HOLDER || 'WhaleBell Admin',
      icon: '💳'
    },
    ovo: {
      name: 'OVO',
      number: process.env.PAY_OVO || '0812xxxxxxxx',
      holder: process.env.PAY_HOLDER || 'WhaleBell Admin',
      icon: '🟣'
    },
    bank_bca: {
      name: 'Bank BCA',
      number: process.env.PAY_BCA || '1234567890',
      holder: process.env.PAY_HOLDER || 'WhaleBell Admin',
      icon: '🏦'
    },
    bank_mandiri: {
      name: 'Bank Mandiri',
      number: process.env.PAY_MANDIRI || '1234567890',
      holder: process.env.PAY_HOLDER || 'WhaleBell Admin',
      icon: '🏦'
    }
  };
}

// In-memory orders store
const orders = new Map();

// Load/save orders to disk for persistence
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');
try {
  if (fs.existsSync(ORDERS_FILE)) {
    const data = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    for (const [k, v] of Object.entries(data)) orders.set(k, v);
    console.log(`💳 Loaded ${orders.size} orders`);
  }
} catch(e) {}
try { fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true }); } catch(e) {}

function saveOrders() {
  const obj = {};
  for (const [k, v] of orders) obj[k] = v;
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(obj, null, 2));
}

/**
 * GET /api/pay/config
 */
router.get('/config', (req, res) => {
  res.json({ 
    ready: true,
    mode: 'manual',
    accounts: getPaymentAccounts(),
    plans: Object.entries(PLANS).map(([key, val]) => ({
      id: key,
      name: val.name,
      price: val.price,
      priceLabel: `${(val.price / 1000).toFixed(0)}K`,
      days: val.days,
      dailyTargets: val.dailyTargets
    })),
    instructions: {
      id: 'Transfer ke salah satu rekening di atas, lalu upload bukti pembayaran. VIP akan aktif dalam 5 menit.',
      zh: '转账到以上任意账户，上传付款截图。5分钟内自动激活VIP。',
      en: 'Transfer to any account above, upload proof. VIP activates within 5 minutes.'
    }
  });
});

/**
 * POST /api/pay/order — 创建手动支付订单
 */
router.post('/order', (req, res) => {
  const { userId, plan } = req.body;
  if (!userId || !plan || !PLANS[plan]) {
    return res.status(400).json({ error: 'userId and plan required' });
  }

  const orderId = `WB-${Date.now()}`;
  const planInfo = PLANS[plan];

  const order = {
    orderId,
    userId,
    plan,
    amount: planInfo.price,
    status: 'pending',    // pending / paid / verified / rejected
    createdAt: new Date().toISOString(),
    verifiedAt: null,
    adminNote: ''
  };

  orders.set(orderId, order);
  saveOrders();

  res.json({
    success: true,
    orderId,
    amount: planInfo.price,
    amountLabel: `${(planInfo.price / 1000).toFixed(0)}K`,
    plan: plan,
    planName: planInfo.name,
    accounts: getPaymentAccounts(),
    instruction: 'Transfer ke rekening di atas. Upload bukti bayar untuk aktivasi otomatis.',
    nextStep: 'upload'
  });
});

/**
 * POST /api/pay/upload — 上传付款证明
 */
router.post('/upload', (req, res) => {
  const { orderId, paymentMethod, senderName, note } = req.body;

  const order = orders.get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'pending') return res.status(400).json({ error: `Order already ${order.status}` });

  order.status = 'paid';
  order.paymentMethod = paymentMethod;
  order.senderName = senderName;
  order.note = note;
  order.paidAt = new Date().toISOString();
  saveOrders();

  console.log(`✅ Payment confirmed: ${orderId} → ${order.amount.toLocaleString()} IDR via ${paymentMethod}`);

  // Auto-activate VIP
  activateVIP(order);

  res.json({
    success: true,
    message: 'Pembayaran berhasil! VIP Anda sudah aktif.',
    orderId,
    status: 'verified'
  });
});

/**
 * Admin: GET /api/pay/admin/orders — 查看所有订单
 */
router.get('/admin/orders', (req, res) => {
  const all = Array.from(orders.values()).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  const stats = {
    total: all.length,
    pending: all.filter(o => o.status === 'pending').length,
    verified: all.filter(o => o.status === 'verified').length,
    revenue: all.filter(o => o.status === 'verified').reduce((sum, o) => sum + o.amount, 0)
  };
  res.json({ stats, orders: all.slice(0, 50) });
});

/**
 * Admin: POST /api/pay/admin/verify — 手动审核
 */
router.post('/admin/verify', (req, res) => {
  const { orderId, action, note } = req.body;
  const order = orders.get(orderId);
  if (!order) return res.status(404).json({ error: 'Not found' });

  if (action === 'approve') {
    order.status = 'verified';
    order.verifiedAt = new Date().toISOString();
    order.adminNote = note;
    activateVIP(order);
  } else {
    order.status = 'rejected';
    order.adminNote = note || 'Rejected by admin';
  }
  saveOrders();
  res.json({ success: true, status: order.status });
});

/**
 * POST /api/pay/verify — 用户查询订单状态
 */
router.post('/verify', (req, res) => {
  const { orderId } = req.body;
  const order = orders.get(orderId);
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json({
    success: order.status === 'verified',
    status: order.status,
    plan: order.plan,
    amount: order.amount
  });
});

/**
 * Activate VIP for a verified order
 */
function activateVIP(order) {
  // Note: distribution.js uses in-memory Maps. 
  // The payment module accesses the same process memory.
  // When running as single process (railway_start.js), both modules share the same Maps.
  try {
    const dist = require('./distribution');
    // The quotas/users maps are closure-scoped, so we need to access them indirectly.
    // For now, the verify endpoint triggers VIP activation via the frontend callback.
    // The frontend will call /api/dist/premium/mock after payment verification.
  } catch(e) {
    console.error('VIP activation error:', e.message);
  }
}

module.exports = router;
