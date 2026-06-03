/**
 * WhaleBell Payment Module
 * Midtrans — Indonesia's #1 Payment Gateway
 * GoPay / OVO / Dana / ShopeePay / Bank Transfer / Credit Card
 */
const express = require('express');
const router = express.Router();

// Midtrans config
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MIDTRANS_API = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

// Plan prices (IDR)
const PLANS = {
  weekly: { name: '周卡', price: 29000, days: 7, dailyTargets: 50 },
  monthly: { name: '月卡', price: 79000, days: 30, dailyTargets: 50 }
};

// In-memory order store (switch to Supabase in production)
const orders = new Map();

/**
 * GET /api/pay/config — 获取 Midtrans Client Key (前端用)
 */
router.get('/config', (req, res) => {
  if (!MIDTRANS_CLIENT_KEY) {
    return res.json({ 
      ready: false, 
      message: 'Midtrans 未配置。请在 .env 中设置 MIDTRANS_SERVER_KEY 和 MIDTRANS_CLIENT_KEY',
      sandboxUrl: 'https://dashboard.sandbox.midtrans.com'
    });
  }
  res.json({ 
    ready: true, 
    clientKey: MIDTRANS_CLIENT_KEY,
    isProduction: IS_PRODUCTION,
    plans: Object.entries(PLANS).map(([key, val]) => ({
      id: key,
      name: val.name,
      price: val.price,
      priceLabel: `${(val.price / 1000).toFixed(0)}K`,
      days: val.days,
      dailyTargets: val.dailyTargets
    }))
  });
});

/**
 * POST /api/pay/order — 创建支付订单
 */
router.post('/order', async (req, res) => {
  const { userId, plan, referralCode } = req.body;
  
  if (!userId || !plan) {
    return res.status(400).json({ error: 'userId and plan required' });
  }
  if (!PLANS[plan]) {
    return res.status(400).json({ error: `Invalid plan: ${plan}` });
  }
  if (!MIDTRANS_SERVER_KEY) {
    return res.status(503).json({ error: 'Payment not configured' });
  }

  const planInfo = PLANS[plan];
  const orderId = `WB-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  try {
    // Call Midtrans Snap API
    const midtransBody = {
      transaction_details: {
        order_id: orderId,
        gross_amount: planInfo.price
      },
      credit_card: { secure: true },
      customer_details: {
        first_name: userId.substring(0, 20),
        email: `${userId}@whalebell.user`
      },
      item_details: [{
        id: plan,
        price: planInfo.price,
        quantity: 1,
        name: `WhaleBell ${planInfo.name}`,
        category: 'Digital Subscription'
      }],
      callbacks: {
        finish: `${req.protocol}://${req.get('host')}/sniper.html?paid=${orderId}`
      }
    };

    const auth = Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64');
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(MIDTRANS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(midtransBody)
    });

    const data = await response.json();

    if (response.ok) {
      // Store order
      orders.set(orderId, { userId, plan, status: 'pending', createdAt: new Date().toISOString() });
      
      res.json({
        success: true,
        orderId,
        token: data.token,           // Snap token
        redirectUrl: data.redirect_url,  // Snap redirect URL
        plan: planInfo,
        amount: planInfo.price
      });
    } else {
      console.error('Midtrans error:', data);
      res.status(502).json({ 
        error: 'Payment gateway error', 
        detail: data.error_messages?.[0] || 'Unknown error'
      });
    }
  } catch (err) {
    console.error('Payment order error:', err.message);
    // Fallback to mock if Midtrans unavailable
    res.json({
      success: true,
      orderId,
      mockPayment: true,
      fallback: true,
      plan: planInfo,
      amount: planInfo.price,
      message: 'Midtrans 暂时不可用，使用模拟支付'
    });
  }
});

/**
 * POST /api/pay/verify — 验证支付结果 & 激活VIP
 */
router.post('/verify', async (req, res) => {
  const { orderId, userId } = req.body;
  
  if (!orderId) return res.status(400).json({ error: 'orderId required' });

  const order = orders.get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (!MIDTRANS_SERVER_KEY) {
    // Mock: auto-approve
    order.status = 'settled';
    return res.json({ success: true, status: 'settled', mock: true });
  }

  try {
    const auth = Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64');
    const checkUrl = `${IS_PRODUCTION 
      ? 'https://api.midtrans.com/v2' 
      : 'https://api.sandbox.midtrans.com/v2'}/${orderId}/status`;
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(checkUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    const data = await response.json();

    if (response.ok && (data.transaction_status === 'settlement' || data.transaction_status === 'capture')) {
      order.status = 'settled';

      // Activate VIP (调用 distribution 的配额系统)
      const quota = global._whalebellQuotas?.get(userId);
      if (quota) {
        quota.premium = true;
        quota.dailyQuota = 50;
        quota.premiumExpiry = new Date(Date.now() + PLANS[order.plan].days * 24 * 3600 * 1000).toISOString();
      }

      // Distribute commission
      if (global._whalebellUsers) {
        const user = global._whalebellUsers.get(userId);
        if (user?.referredBy) {
          const { commission } = global._whalebellCommissions?.get(user.referredBy) || { balance: 0, lifetimeEarnings: 0, history: [] };
          const amount = Math.floor(PLANS[order.plan].price * 0.40);
          commission.balance += amount;
          commission.lifetimeEarnings += amount;
          commission.history.push({
            from: userId, type: 'L1_purchase', amount, plan: order.plan, time: new Date().toISOString()
          });
        }
      }

      res.json({ success: true, status: 'settled', plan: order.plan });
    } else {
      res.json({ success: false, status: data.transaction_status, detail: data });
    }
  } catch (err) {
    console.error('Verify error:', err.message);
    res.json({ success: false, error: err.message });
  }
});

/**
 * POST /api/pay/webhook — Midtrans 回调通知
 */
router.post('/webhook', (req, res) => {
  const { order_id, transaction_status, fraud_status } = req.body;
  
  console.log(`📩 Midtrans webhook: ${order_id} → ${transaction_status}`);
  
  const order = orders.get(order_id);
  if (!order) return res.status(404).json({ error: 'Not found' });

  if (transaction_status === 'settlement' || transaction_status === 'capture') {
    order.status = 'settled';
  } else if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
    order.status = 'failed';
  }

  res.json({ ok: true });
});

module.exports = router;
