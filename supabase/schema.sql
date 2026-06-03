-- ============================================================
-- WhaleBell Database Schema v2.0
-- 多级裂变 + 现金抽成 + 拼团 + 话术引擎
-- ============================================================

-- 用户扩展信息
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  streamer_category TEXT,       -- 主播品类: dance/beauty/singer/comedy/gaming/lifestyle/talk
  referral_code TEXT UNIQUE,    -- 邀请码
  referred_by UUID REFERENCES profiles(id),      -- L1 上级
  referred_by_l2 UUID REFERENCES profiles(id),   -- L2 上上级
  total_referrals INTEGER DEFAULT 0,
  total_earnings BIGINT DEFAULT 0,               -- 累计佣金(IDR)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 佣金记录
CREATE TABLE commissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,            -- 佣金金额 (IDR)
  commission_type TEXT NOT NULL,     -- L1_purchase / L2_purchase / group_bonus
  from_user_id UUID REFERENCES profiles(id),
  plan TEXT,                         -- weekly / monthly
  group_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 邀请记录
CREATE TABLE referrals (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,         -- 邀请码
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redeemed_by UUID REFERENCES profiles(id),
  tier INTEGER DEFAULT 1,            -- 1=直推, 2=间推
  reward_quota INTEGER DEFAULT 2,    -- 奖励配额数
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 拼团
CREATE TABLE group_buys (
  id TEXT PRIMARY KEY,               -- GRP + timestamp36
  leader_id UUID NOT NULL REFERENCES profiles(id),
  target_count INTEGER DEFAULT 3,
  status TEXT DEFAULT 'open',        -- open / completed / expired
  reward_granted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE group_members (
  group_id TEXT REFERENCES group_buys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- 话术使用记录 (用于优化推荐)
CREATE TABLE comment_templates (
  id SERIAL PRIMARY KEY,
  template_type TEXT NOT NULL,       -- recognition / mystery / challenge / curiosity
  lang TEXT NOT NULL,                -- id / zh / en
  content TEXT NOT NULL,
  use_count INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0       -- 狙击成功率
);

-- 大哥标签画像 (来自 WhaleSense)
CREATE TABLE whale_profiles (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT,
  level INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  persona TEXT,                      -- often_gifter / night_owl / gamer / beauty_dancer
  active_window TEXT,                -- "20:00-23:00"
  total_gifts BIGINT DEFAULT 0,
  last_seen_room TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 配额
CREATE TABLE user_quotas (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  daily_quota INTEGER DEFAULT 5,
  used_today INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expiry TIMESTAMPTZ,
  unlocked_premium BOOLEAN DEFAULT FALSE,
  reset_at TIMESTAMPTZ DEFAULT (CURRENT_DATE + INTERVAL ''1 day'')
);

-- === 索引 ===
CREATE INDEX idx_commissions_user ON commissions(user_id);
CREATE INDEX idx_referrals_inviter ON referrals(inviter_id);
CREATE INDEX idx_referrals_code ON referrals(code);
CREATE INDEX idx_whale_profiles_tags ON whale_profiles USING GIN(tags);
CREATE INDEX idx_whale_profiles_level ON whale_profiles(level DESC);

-- === RLS ===
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- 用户看自己
CREATE POLICY "self_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "self_commissions" ON commissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "self_quota" ON user_quotas FOR SELECT USING (auth.uid() = user_id);

-- 邀请码公开读 (用于兑换验证)
CREATE POLICY "public_referral_code" ON referrals FOR SELECT USING (true);

-- 拼团公开读
CREATE POLICY "public_group_buys" ON group_buys FOR SELECT USING (true);
CREATE POLICY "public_group_members" ON group_members FOR SELECT USING (true);
