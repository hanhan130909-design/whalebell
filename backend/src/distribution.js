/**
 * WhaleBell Distribution System v2.0
 * 多级裂变 + 现金抽成 + 姐妹拼团 + 佣金系统
 */
const express = require('express');
const router = express.Router();

// ============================================================
// In-memory store → 后续迁移到 Supabase
// ============================================================
const users = new Map();       // userId → user profile
const quotas = new Map();      // userId → quota
const referrals = new Map();   // code → referral info
const commissions = new Map(); // userId → commission balance
const groups = new Map();      // groupId → group info

// ============================================================
// 用户初始化
// ============================================================
function initUser(userId) {
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      createdAt: new Date().toISOString(),
      referralCode: null,
      referredBy: null,       // 谁邀请的 (Level-1 upline)
      referredByL2: null,     // 上上级 (Level-2 upline, 通过L1间接)
      totalReferrals: 0,
      totalEarnings: 0,
      streamerCategory: null
    });
  }
  if (!quotas.has(userId)) {
    quotas.set(userId, {
      dailyQuota: 5,
      used: 0,
      premium: false,
      premiumExpiry: null,
      unlockedPremiumTargets: false
    });
  }
  if (!commissions.has(userId)) {
    commissions.set(userId, {
      balance: 0,           // 可提现余额 (IDR)
      lifetimeEarnings: 0,  // 终身累计
      history: []           // 佣金记录
    });
  }
  return { user: users.get(userId), quota: quotas.get(userId), commission: commissions.get(userId) };
}

function getQuota(userId) {
  initUser(userId);
  return quotas.get(userId);
}

// ============================================================
// 佣金配置
// ============================================================
const COMMISSION_CONFIG = {
  // Level-1 直推: 被邀请人买VIP, 邀请人拿 40%
  l1_purchase_rate: 0.40,
  // Level-2 间推: 被邀请人的被邀请人买VIP, 最上级拿 10%
  l2_purchase_rate: 0.10,
  // 拼团团长额外奖励
  group_leader_bonus: 0.05,
  // VIP 价格 (IDR)
  prices: {
    weekly: 29000,   // 29K IDR
    monthly: 79000   // 79K IDR
  }
};

// ============================================================
// ① GET /api/dist/quota — 配额查询
// ============================================================
router.get('/quota', (req, res) => {
  const userId = req.query.userId || req.headers['x-user-id'];
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const quota = getQuota(userId);
  const remaining = quota.premium ? 999 : (quota.dailyQuota - quota.used);
  const { commission } = initUser(userId);

  res.json({
    userId,
    freeQuota: Math.max(0, remaining),
    totalFree: quota.premium ? 999 : quota.dailyQuota,
    isPremium: quota.premium,
    hasUnlockedPremium: quota.unlockedPremiumTargets,
    targetsToday: quota.used,
    commissionBalance: commission.balance,
    lifetimeEarnings: commission.lifetimeEarnings
  });
});

// ============================================================
// ② POST /api/dist/referral/generate — 生成邀请码
// ============================================================
router.post('/referral/generate', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const { user } = initUser(userId);

  // 已有码就返回
  if (user.referralCode) {
    return res.json({
      code: user.referralCode,
      shareUrl: `${req.protocol}://${req.get('host')}/sniper.html?ref=${user.referralCode}`,
      totalReferrals: user.totalReferrals,
      totalEarnings: user.totalEarnings
    });
  }

  // 生成6位码
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

  user.referralCode = code;
  referrals.set(code, { userId, usedBy: [], level2By: [] });

  res.json({
    code,
    shareUrl: `${req.protocol}://${req.get('host')}/sniper.html?ref=${code}`,
    totalReferrals: 0,
    totalEarnings: 0,
    reward: '每直推1人=+2名额，直推买VIP你拿40%佣金 💰'
  });
});

// ============================================================
// ③ POST /api/dist/referral/redeem — 使用邀请码 (多级裂变)
// ============================================================
router.post('/referral/redeem', (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) return res.status(400).json({ error: 'userId and code required' });

  const ref = referrals.get(code.toUpperCase());
  if (!ref) return res.status(404).json({ error: '邀请码无效' });
  if (ref.userId === userId) return res.status(400).json({ error: '不能使用自己的邀请码' });

  const { user: newUser } = initUser(userId);
  const { user: inviter } = initUser(ref.userId);

  // 检查是否已被邀请过
  if (newUser.referredBy) {
    return res.status(400).json({ error: '你已被其他人邀请过了' });
  }

  // === 多级裂变逻辑 ===
  // Level 1: 直接邀请
  newUser.referredBy = ref.userId;
  ref.usedBy.push(userId);
  inviter.totalReferrals++;

  // 直推奖励: 双方各+2配额
  const inviterQuota = getQuota(ref.userId);
  inviterQuota.dailyQuota += 2;

  const newUserQuota = getQuota(userId);
  newUserQuota.dailyQuota += 2;

  // 邀请人满10配额 → 解锁VIP大哥
  if (inviterQuota.dailyQuota >= 10) {
    inviterQuota.unlockedPremiumTargets = true;
  }

  // Level 2: 间推 (邀请人的上级)
  if (inviter.referredBy) {
    newUser.referredByL2 = inviter.referredBy;
    const { user: l2Inviter } = initUser(inviter.referredBy);
    l2Inviter.totalReferrals++;

    // 间推奖励: L2上级 +1配额
    const l2Quota = getQuota(inviter.referredBy);
    l2Quota.dailyQuota += 1;

    if (!ref.level2By) ref.level2By = [];
    ref.level2By.push(userId);
  }

  res.json({
    success: true,
    reward: '+2 大哥名额',
    yourQuota: newUserQuota.dailyQuota,
    tier: newUser.referredByL2 ? 'Level-2 (间推)' : 'Level-1 (直推)'
  });
});

// ============================================================
// ④ POST /api/dist/premium/mock — VIP购买 (含佣金分发)
// ============================================================
router.post('/premium/mock', (req, res) => {
  const { userId, plan } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const quota = getQuota(userId);
  const { user } = initUser(userId);
  const price = COMMISSION_CONFIG.prices[plan] || COMMISSION_CONFIG.prices.monthly;

  // 激活VIP
  quota.premium = true;
  quota.dailyQuota = 50;
  quota.premiumExpiry = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

  // === 佣金分发 ===
  const commissionLog = [];

  // Level-1 直推佣金
  if (user.referredBy) {
    const { commission: l1Comm } = initUser(user.referredBy);
    const l1Amount = Math.floor(price * COMMISSION_CONFIG.l1_purchase_rate);
    l1Comm.balance += l1Amount;
    l1Comm.lifetimeEarnings += l1Amount;
    l1Comm.history.push({
      from: userId,
      type: 'L1_purchase',
      amount: l1Amount,
      plan,
      time: new Date().toISOString()
    });
    const { user: l1User } = initUser(user.referredBy);
    l1User.totalEarnings += l1Amount;
    commissionLog.push({ tier: 'L1', userId: user.referredBy, amount: l1Amount });
  }

  // Level-2 间推佣金
  if (user.referredByL2) {
    const { commission: l2Comm } = initUser(user.referredByL2);
    const l2Amount = Math.floor(price * COMMISSION_CONFIG.l2_purchase_rate);
    l2Comm.balance += l2Amount;
    l2Comm.lifetimeEarnings += l2Amount;
    l2Comm.history.push({
      from: userId,
      type: 'L2_purchase',
      amount: l2Amount,
      plan,
      time: new Date().toISOString()
    });
    const { user: l2User } = initUser(user.referredByL2);
    l2User.totalEarnings += l2Amount;
    commissionLog.push({ tier: 'L2', userId: user.referredByL2, amount: l2Amount });
  }

  res.json({
    success: true,
    plan,
    price: `${(price/1000).toFixed(0)}K`,
    dailyTargets: 50,
    expiresAt: quota.premiumExpiry,
    commissionDistributed: commissionLog,
    message: '🎉 VIP已开通！每天可狙击50个大哥'
  });
});

// ============================================================
// ⑤ POST /api/dist/group/create — 姐妹拼团
// ============================================================
router.post('/group/create', (req, res) => {
  const { userId, targetMemberCount } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const groupId = 'GRP' + Date.now().toString(36).toUpperCase();
  const { user } = initUser(userId);

  groups.set(groupId, {
    id: groupId,
    leaderId: userId,
    members: [userId],
    targetCount: targetMemberCount || 3,
    status: 'open',     // open / locked / completed
    rewardGranted: false,
    createdAt: new Date().toISOString()
  });

  // 团长专属链接
  const joinUrl = `${req.protocol}://${req.get('host')}/sniper.html?group=${groupId}`;

  res.json({
    groupId,
    joinUrl,
    currentMembers: 1,
    targetMembers: targetMemberCount || 3,
    reward: '满员后全员解锁VIP大哥 + 团长额外5%佣金加成',
    shareText: `🔥 Ayo join grup aku di WhaleBell! Kita barengan snipe大哥, gratis VIP! ${joinUrl}`
  });
});

// ============================================================
// ⑥ POST /api/dist/group/join — 加入拼团
// ============================================================
router.post('/group/join', (req, res) => {
  const { userId, groupId } = req.body;
  if (!userId || !groupId) return res.status(400).json({ error: 'userId and groupId required' });

  const group = groups.get(groupId);
  if (!group) return res.status(404).json({ error: '拼团不存在' });
  if (group.status !== 'open') return res.status(400).json({ error: '拼团已结束' });
  if (group.members.includes(userId)) return res.status(400).json({ error: '你已在团内' });

  group.members.push(userId);

  // 满员 → 全员解锁
  if (group.members.length >= group.targetCount) {
    group.status = 'completed';
    group.rewardGranted = true;

    // 全员解锁VIP大哥
    for (const memberId of group.members) {
      const q = getQuota(memberId);
      q.unlockedPremiumTargets = true;
      q.dailyQuota += 5; // 拼团奖励
    }

    // 团长额外佣金加成
    const { commission: leaderComm } = initUser(group.leaderId);
    leaderComm.balance += 5000; // 5K IDR bonus
    leaderComm.history.push({
      type: 'group_leader_bonus',
      amount: 5000,
      groupId,
      time: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    currentMembers: group.members.length,
    targetMembers: group.targetCount,
    isComplete: group.status === 'completed',
    reward: group.status === 'completed' ? '🎉 拼团成功！全员解锁VIP大哥' : `还差 ${group.targetCount - group.members.length} 人成团`
  });
});

// ============================================================
// ⑦ GET /api/dist/referral/stats — 邀请统计+佣金
// ============================================================
router.get('/referral/stats', (req, res) => {
  const userId = req.query.userId || req.headers['x-user-id'];
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const { user, commission } = initUser(userId);

  res.json({
    totalReferrals: user.totalReferrals,
    referralCode: user.referralCode,
    commissionBalance: commission.balance,
    lifetimeEarnings: commission.lifetimeEarnings,
    commissionHistory: commission.history.slice(-10), // 最近10条
    shareText: user.referralCode
      ? `🔥 Ajak teman pakai kode "${user.referralCode}", kamu dapat +2大哥 + 40% komisi VIP!`
      : 'Buat kode undanganmu sekarang!'
  });
});

// ============================================================
// ⑧ GET /api/dist/commission — 佣金详情
// ============================================================
router.get('/commission', (req, res) => {
  const userId = req.query.userId || req.headers['x-user-id'];
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const { commission } = initUser(userId);

  res.json({
    balance: commission.balance,
    lifetimeEarnings: commission.lifetimeEarnings,
    withdrawable: commission.balance > 0,
    minWithdraw: 50000, // 50K IDR 起提
    history: commission.history.slice(-20)
  });
});

module.exports = router;
