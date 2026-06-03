/**
 * WhaleBell Payment Module v3
 * Lemon Squeezy — 全球收款 / 零公司注册 / 自动处理税务
 */
const express = require('express');
const router = express.Router();

const LEMON_API = 'https://api.lemonsqueezy.com/v1';
const LEMON_API_KEY = process.env.LEMON_API_KEY;
const LEMON_STORE_ID = process.env.LEMON_STORE_ID;
const LEMON_WEEKLY_VARIANT = process.env.LEMON_WEEKLY_VARIANT;   // 29K 周卡
const LEMON_MONTHLY_VARIANT = process.env.LEMON_MONTHLY_VARIANT; // 79K 月卡

const PLANS = {
  weekly: { name: '周卡', price: 29000, priceUSD: 1.99, days: 7, variantId: LEMON_WEEKLY_VARIANT },
  monthly: { name: '月卡', price: 79000, priceUSD: 4.99, days: 30, variantId: LEMON_MONTHLY_VARIANT }
};

const orders = new Map();

// Load persisted orders
const fs = require('fs');
const path = require('path');
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');
try { fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true }); } catch(e) {}
try {
  if (fs.existsSync(ORDERS_FILE)) {
    for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8')))) {
      orders.set(k, v);
    }
  }
} catch(e) {}

function saveOrders() {
  const obj = {};
  for (const [k, v] of orders) obj[k] = v;
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(obj, null, 2));
}

/**
 * GET /api/pay/config
 */
router.get('/config', (req, res) => {
  const mode = LEMON_API_KEY ? 'lemon' : 'manual';
  res.json({
    mode,
    plans: Object.entries(PLANS).map(([key, val]) => ({
      id: key, name: val.name, price: val.price,
      priceLabel: `${(val.price / 1000).toFixed(0)}K`,
      priceUSD: val.priceUSD, days: val.days
    })),
    storeId: LEMON_STORE_ID || null,
    ready: mode === 'lemon',
    registerUrl: 'https://app.lemonsqueezy.com/signup'
  });
});

/**
 * POST /api/pay/order — Lemon Squeezy checkout
 */
router.post('/order', async (req, res) => {
  const { userId, plan } = req.body;
  if (!userId || !plan || !PLANS[plan]) {
    return res.status(400).json({ error: 'userId and plan required' });
  }

  const planInfo = PLANS[plan];
  const orderId = `WB-${Date.now()}`;

  // Store order
  orders.set(orderId, {
    orderId, userId, plan, amount: planInfo.priceUSD,
    status: 'pending', createdAt: new Date().toISOString()
  });
  saveOrders();

  if (!LEMON_API_KEY || !planInfo.variantId) {
    // Fallback to manual payment
    return res.json({
      success: true, orderId, fallback: true,
      mode: 'manual',
      amount: planInfo.price, plan: plan,
      message: 'Lemon Squeezy 未配置，使用手动支付'
    });
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const resp = await fetch(`${LEMON_API}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEMON_API_KEY}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              custom: { order_id: orderId, user_id: userId }
            },
            product_options: {
              enabled_variants: [parseInt(planInfo.variantId)]
            },
            checkout_options: {
              embed: true,
              button_color: '#FF6B9D'
            }
          },
          relationships: {
            store: { data: { type: 'stores', id: LEMON_STORE_ID } },
            variant: { data: { type: 'variants', id: planInfo.variantId } }
          }
        }
      })
    });

    const data = await resp.json();

    if (resp.ok && data.data) {
      res.json({
        success: true,
        orderId,
        checkoutUrl: data.data.attributes.url,
        mode: 'lemon',
        plan: plan,
        amount: planInfo.priceUSD
      });
    } else {
      console.error('Lemon error:', data);
      res.json({ success: true, orderId, fallback: true, mode: 'manual', plan: plan });
    }
  } catch (err) {
    console.error('Lemon order error:', err.message);
    res.json({ success: true, orderId, fallback: true, mode: 'manual', plan: plan });
  }
});

/**
 * POST /api/pay/verify
 */
router.post('/verify', (req, res) => {
  const { orderId } = req.body;
  const order = orders.get(orderId);
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json({ success: order.status === 'verified', status: order.status });
});

/**
 * POST /api/pay/webhook — Lemon Squeezy webhook
 */
router.post('/webhook', (req, res) => {
  const event = req.body?.meta?.event_name;
  const customData = req.body?.data?.attributes?.checkout_data?.custom || {};
  const orderId = customData.order_id;

  console.log(`📩 Lemon webhook: ${event} → ${orderId}`);

  if (event === 'order_created' && orderId) {
    const order = orders.get(orderId);
    if (order) {
      order.status = 'verified';
      order.verifiedAt = new Date().toISOString();
      saveOrders();
      console.log(`✅ Order ${orderId} verified`);
    }
  }

  res.json({ ok: true });
});

/**
 * Admin dashboard
 */
router.get('/admin/orders', (req, res) => {
  const all = Array.from(orders.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({
    stats: {
      total: all.length,
      verified: all.filter(o => o.status === 'verified').length,
      revenue: all.filter(o => o.status === 'verified')
        .reduce((sum, o) => sum + (o.amount || 0), 0)
    },
    orders: all.slice(0, 50)
  });
});

module.exports = router;
