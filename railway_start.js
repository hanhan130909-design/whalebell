// Step 4: Full app - HTML + API
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3101;
const FRONTEND = path.join(__dirname, 'frontend');

app.use(cors());
app.use(express.json());

// API: Sniper (inlined, IIFE-wrapped)
(function() {
  const router = express.Router();
  /**
 * WhaleBell Vanity Sniper API v2.0
 * 化妆间狙击模式 — 话术引擎 + 标签匹配 + Deep Link
 */


// ============================================================
// 话术模板引擎 — 按大哥人格类型匹配
// ============================================================
const COMMENT_TEMPLATES = {
  // ① 身份认可型 — 适合 often_gifter / 高频送礼大哥
  recognition: {
    matchTags: ['热舞', '颜值', '大方', '超级VIP', '重量级', '所有品类'],
    templates: {
      id: [
        "Bang, barusan gue liat badge LV lo di live orang. Respect banget sih, jarang ada yang se-looyal ini support creator kecil. Salut! 👑",
        "Kak, lo tipe penonton yang bikin streamer semangat live. Jarang banget nemu yang loyal kaya gini. Auto respect! 💯",
        "Gue sering liat username lo di berbagai live. Bener-bener legend sih, gak banyak yang bisa konsisten support creator kaya lo 🙌"
      ],
      zh: [
        "大哥，你在这个平台就是传说级别的存在。每次看到你的等级徽章，小主播们都得仰望。今晚有空来看看？😎",
        "刚在别人直播间看到你的榜一了。说实话，你这么支持创作者的，全平台数不出三个。敬你！🥂",
        "你的LV徽章走在哪都是焦点。像你这样的大哥，值得最好的直播体验。今晚来试试？✨"
      ],
      en: [
        "Just saw your badge in another stream. Legend status confirmed. Creators like us notice supporters like you. Respect! 👑",
        "You're the type of viewer that makes streaming worth it. Rare to find someone this loyal. Drop by tonight? 💯",
        "Spotted your LV badge from across TikTok. Not many supporters like you out there. Salute! 🫡"
      ]
    }
  },

  // ② 神秘预告型 — 适合 night_owl / 深夜活跃型
  mystery: {
    matchTags: ['搞笑', '脱口秀', '夜生活', '情感', '讲故事'],
    templates: {
      id: [
        "Kak, bentar lagi ada yang spesial nih jam 8 malam. Coba aja mampir, siapa tau cocok sama vibes lo yang chill gitu 😏",
        "Malam ini ada sesuatu yang berbeda. Gak bakal nyesel mampir. Trust me, vibes-nya cocok sama energi lo 🌙",
        "Ada surprise kecil nanti malam. Gak bakal gue spoiler, tapi kalo lo suka yang chill dan deep, mampir aja jam 8 ✨"
      ],
      zh: [
        "今晚8点有场特别的。来看一眼呗，说不定跟你的气场很搭。不剧透，来了就知道 😏",
        "今晚准备了点不一样的。看了你的主页，感觉你会喜欢。8点钟，不见不散？🌙",
        "刚看完你视频，直觉告诉我你会喜欢今晚的场子。留个悬念，8点见 ✨"
      ],
      en: [
        "Something special tonight at 8PM. Your vibe tells me you'd enjoy this. No spoilers — just show up 😏",
        "Got a feeling tonight's stream matches your energy. Drop by at 8 and see for yourself 🌙",
        "Just watched your content. Something tells me you'd vibe with tonight's show. 8PM. Be there ✨"
      ]
    }
  },

  // ③ 趣味挑战型 — 适合 gamer / 竞技型
  challenge: {
    matchTags: ['竞技', '游戏', '车', '挑战', '互动', '电玩'],
    templates: {
      id: [
        "Kak, lo keliatan orangnya asik banget. Berani taruhan? Kalo lo bisa nebak lagu pembuka gue nanti malem, gue kasih shoutout spesial 😂",
        "Satu challenge kecil: coba tebak tema live gue malam ini. Yang bener dapet free request lagu. Berani? 🎮",
        "Challenge nih: lo vs gue. Tebak berapa orang yang bakal join live gue malam ini. Paling deket menang shoutout! 🏆"
      ],
      zh: [
        "大哥，看你主页就知道你是爱玩的人。敢不敢来我直播间打个赌？猜中我开场曲，给你专属喊麦 😂",
        "一个小挑战：猜猜今晚我直播间多少人？赢了有惊喜。输了也得来打个招呼！🏆",
        "看你视频就知道你不服输。今晚来直播间，给你个专属挑战，输了请你喝奶茶 😂"
      ],
      en: [
        "You look like someone who loves a challenge. Guess my opening song tonight and win a special shoutout. Deal? 🎮",
        "Quick bet: guess tonight's stream theme. Winner gets a free song request. You in? 😏",
        "Your profile screams competitive. Challenge: guess my viewer count tonight. Closest wins VIP treatment! 🏆"
      ]
    }
  },

  // ④ 好奇钩子型 — 适合 beauty_dancer / 颜值类
  curiosity: {
    matchTags: ['唱歌', '弹唱', '民谣', '音乐', '乐器', '文艺', '旅行', '美食', '生活'],
    templates: {
      id: [
        "Kak, profile lo aesthetic banget sih. Kayanya selera kita mirip deh. Nanti malem gue live, coba mampir liat vibes-nya 🌸",
        "Dari postingan lo, kayaknya kita satu frekuensi. Malam ini gue live, mampir yuk. Gak bakal nyesel 🎵",
        "Suka banget sama konten lo. Tenang, chill, authentic. Malam ini gue live with similar vibes. Dateng ya? 🌿"
      ],
      zh: [
        "大哥，你主页审美绝了。感觉我们品味很对路。今晚来直播间坐坐，保证跟你气场很搭 🌸",
        "看了你的内容，觉得你是那种懂生活有品位的人。今晚的主题你应该会喜欢 🎵",
        "从你视频能看出你是个有故事的人。今晚直播间，想听听你的看法。来聊聊？🌿"
      ],
      en: [
        "Your profile aesthetic is on point. Feel like we share the same taste. Tonight's stream might be your vibe 🌸",
        "From your posts, I can tell we're on the same wavelength. Drop by tonight, you won't regret it 🎵",
        "Love your content. Chill, authentic, real. Tonight's stream has similar energy. Pull up? 🌿"
      ]
    }
  }
};

// 标签→模板类型 映射表
const TAG_TO_TEMPLATE = {};
for (const [type, config] of Object.entries(COMMENT_TEMPLATES)) {
  for (const tag of config.matchTags) {
    if (!TAG_TO_TEMPLATE[tag]) TAG_TO_TEMPLATE[tag] = [];
    TAG_TO_TEMPLATE[tag].push(type);
  }
}

/**
 * 根据大哥标签匹配最佳话术模板
 */
function matchTemplate(whaleTags, lang = 'id') {
  // 统计每个模板类型的命中次数
  const scores = {};
  for (const tag of whaleTags) {
    const types = TAG_TO_TEMPLATE[tag] || [];
    for (const type of types) {
      scores[type] = (scores[type] || 0) + 1;
    }
  }

  // 选得分最高的类型，平局随机
  let bestType = 'recognition';
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  // 从该类型中随机选一条
  const templates = COMMENT_TEMPLATES[bestType]?.templates[lang]
    || COMMENT_TEMPLATES[bestType]?.templates['id']
    || COMMENT_TEMPLATES.recognition.templates.id;
  
  const comment = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    templateType: bestType,
    comment,
    lang
  };
}

/**
 * 生成 Deep Link
 */
function getDeepLinks(username) {
  return {
    profile: `tiktok://user/${username}`,
    web: `https://www.tiktok.com/@${username}`,
    // 一键唤醒 App 的 Universal Link
    universal: `https://www.tiktok.com/@${username}?_t=whalebell`
  };
}

// ============================================================
// 大哥数据 (mock — 后续接 WhaleSense 真实数据)
// ============================================================
const TARGETS = [
  { id: 1, username: "budi_jkt48", nickname: "Budi桑", level: 42, tags: ["热舞", "颜值", "大方"], lastActive: "2分钟前", persona: "often_gifter" },
  { id: 2, username: "sultan_medan88", nickname: "Sultan Medan", level: 38, tags: ["搞笑", "脱口秀", "夜生活"], lastActive: "5分钟前", persona: "night_owl" },
  { id: 3, username: "maxpower_jay", nickname: "Max Power", level: 35, tags: ["竞技", "游戏", "车"], lastActive: "8分钟前", persona: "gamer" },
  { id: 4, username: "richard_sobat", nickname: "Richard Sobat", level: 45, tags: ["音乐", "乐器", "文艺"], lastActive: "12分钟前", persona: "beauty_dancer" },
  { id: 5, username: "jokowi_medan", nickname: "Jokowi Medan", level: 31, tags: ["美食", "旅行", "生活"], lastActive: "15分钟前", persona: "beauty_dancer" },
  { id: 6, username: "bang_aldi99", nickname: "Bang Aldi", level: 50, tags: ["所有品类", "超级VIP", "重量级"], lastActive: "20分钟前", persona: "often_gifter", isPremium: true },
  { id: 7, username: "ipunk_parapat", nickname: "Ipunk Parapat", level: 33, tags: ["唱歌", "弹唱", "民谣"], lastActive: "22分钟前", persona: "beauty_dancer" },
  { id: 8, username: "tomi_siantar", nickname: "Tomi Siantar", level: 36, tags: ["搞笑", "挑战", "互动"], lastActive: "25分钟前", persona: "gamer" },
  { id: 9, username: "coki_pardede", nickname: "Coki Pardede", level: 40, tags: ["脱口秀", "讲故事", "情感"], lastActive: "30分钟前", persona: "night_owl", isPremium: true },
  { id: 10, username: "raja_ulin_saja", nickname: "Raja Ulin Saja", level: 44, tags: ["游戏", "竞技", "电玩"], lastActive: "35分钟前", persona: "gamer" }
];

// 主播品类 ↔ 大哥标签 匹配权重
const STREAMER_CATEGORIES = {
  'dance': { label: '💃 热舞', targetTags: ['热舞', '颜值'], weight: 1.5 },
  'beauty': { label: '✨ 颜值', targetTags: ['颜值', '大方', '热舞'], weight: 1.3 },
  'singer': { label: '🎤 唱歌', targetTags: ['唱歌', '音乐', '乐器', '文艺'], weight: 1.4 },
  'comedy': { label: '😂 搞笑', targetTags: ['搞笑', '脱口秀', '挑战'], weight: 1.2 },
  'gaming': { label: '🎮 游戏', targetTags: ['游戏', '竞技', '电玩'], weight: 1.5 },
  'lifestyle': { label: '🌿 生活', targetTags: ['生活', '美食', '旅行'], weight: 1.0 },
  'talk': { label: '💬 聊天', targetTags: ['脱口秀', '讲故事', '情感', '互动'], weight: 1.1 }
};

// ============================================================
// GET /api/sniper/targets — 获取今日狙击目标
// ============================================================
router.get('/targets', (req, res) => {
  const { userId, limit, category, lang } = req.query;
  const count = parseInt(limit) || 10;
  const language = lang || 'id';

  let scored = TARGETS.map(t => {
    let score = t.level * 10 + (t.isPremium ? 50 : 0);

    // 如果主播选了品类，加权匹配对应标签的大哥
    if (category && STREAMER_CATEGORIES[category]) {
      const cat = STREAMER_CATEGORIES[category];
      const matchCount = t.tags.filter(tag => cat.targetTags.includes(tag)).length;
      score += matchCount * 15 * cat.weight;
    }

    // 话术匹配
    const template = matchTemplate(t.tags, language);
    
    // Deep link
    const links = getDeepLinks(t.username);

    return {
      ...t,
      score,
      comment: template.comment,
      templateType: template.templateType,
      deepLinks: links,
      videoUrl: links.web
    };
  });

  // 按得分排序
  scored.sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    total: TARGETS.length,
    targets: scored.slice(0, count),
    generatedAt: new Date().toISOString(),
    categories: Object.entries(STREAMER_CATEGORIES).map(([key, val]) => ({
      id: key,
      label: val.label
    })),
    tip: {
      id: 'Like + komen video terbaru bos. Ada 30% kemungkinan dia mampir ke live lo!',
      zh: '点赞+评论大哥最新视频，开播后有30%概率顺着痕迹进你直播间！',
      en: 'Like + comment on their latest video. 30% chance they visit your stream!'
    }
  });
});

// ============================================================
// GET /api/sniper/targets/:id — 单个目标
// ============================================================
router.get('/targets/:id', (req, res) => {
  const target = TARGETS.find(t => t.id === parseInt(req.params.id));
  if (!target) return res.status(404).json({ error: 'Target not found' });

  const template = matchTemplate(target.tags);
  const links = getDeepLinks(target.username);

  res.json({
    ...target,
    comment: template.comment,
    templateType: template.templateType,
    deepLinks: links
  });
});

// ============================================================
// GET /api/sniper/categories — 主播品类列表
// ============================================================
router.get('/categories', (req, res) => {
  res.json({
    categories: Object.entries(STREAMER_CATEGORIES).map(([key, val]) => ({
      id: key,
      label: val.label
    }))
  });
});

// ============================================================
// POST /api/sniper/comment — 手动获取/刷新话术
// ============================================================
router.post('/comment', (req, res) => {
  const { tags, lang } = req.body;
  if (!tags || !Array.isArray(tags)) {
    return res.status(400).json({ error: 'tags array required' });
  }
  const result = matchTemplate(tags, lang || 'id');
  res.json(result);
});
  app.use('/api/sniper', router);
})();

// API: Distribution (inlined, IIFE-wrapped)
(function() {
  const router = express.Router();
  /**
 * WhaleBell Distribution System v2.0
 * 多级裂变 + 现金抽成 + 姐妹拼团 + 佣金系统
 */


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
  app.use('/api/dist', router);
})();

// Static frontend
app.get('/sniper.html', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(fs.readFileSync(path.join(FRONTEND, 'sniper.html'), 'utf-8'));
});
app.get('/dashboard.html', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(fs.readFileSync(path.join(FRONTEND, 'dashboard.html'), 'utf-8'));
});
app.get('/index.html', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(fs.readFileSync(path.join(FRONTEND, 'index.html'), 'utf-8'));
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/debug', (req, res) => res.json({ dir: FRONTEND, files: fs.existsSync(FRONTEND) ? fs.readdirSync(FRONTEND) : 'NA' }));
app.get('/', (req, res) => res.redirect('/sniper.html'));

app.listen(PORT, '0.0.0.0', () => {
  console.log('🐋 Step4 on 0.0.0.0:' + PORT);
});
