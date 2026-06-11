-- ============================================================
-- WhaleBell Migration 001: 金主画像表
-- ============================================================
DROP TABLE IF EXISTS whale_profiles CASCADE;

CREATE TABLE whale_profiles (
  username        TEXT PRIMARY KEY,
  nickname        TEXT,
  level           INTEGER DEFAULT 0,
  region          TEXT,
  profile_url     TEXT,
  preference      TEXT DEFAULT 'unknown',
  persona         TEXT DEFAULT 'unknown',
  active_hours    JSONB DEFAULT '[]',
  active_days     JSONB DEFAULT '[]',
  interaction_style TEXT DEFAULT 'unknown',
  profile_status  TEXT DEFAULT 'unknown',
  total_gifts     BIGINT DEFAULT 0,
  total_sessions  INTEGER DEFAULT 0,
  avg_gifts_per_session BIGINT DEFAULT 0,
  top_rooms       JSONB DEFAULT '[]',
  script_template TEXT,
  script_lang     TEXT DEFAULT 'id',
  confidence      FLOAT DEFAULT 0,
  first_seen      TIMESTAMPTZ,
  last_seen       TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whale_profiles_level ON whale_profiles(level DESC);
CREATE INDEX idx_whale_profiles_preference ON whale_profiles(preference);
CREATE INDEX idx_whale_profiles_persona ON whale_profiles(persona);
CREATE INDEX idx_whale_profiles_last_seen ON whale_profiles(last_seen DESC);
CREATE INDEX idx_whale_profiles_region ON whale_profiles(region);
CREATE INDEX idx_whale_profiles_confidence ON whale_profiles(confidence DESC);

ALTER TABLE whale_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_profiles" ON whale_profiles FOR SELECT USING (true);
CREATE POLICY "service_insert_profiles" ON whale_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_profiles" ON whale_profiles FOR UPDATE USING (true);

-- 话术模板表
CREATE TABLE IF NOT EXISTS script_templates (
  id SERIAL PRIMARY KEY,
  persona TEXT NOT NULL,
  lang TEXT NOT NULL,
  content TEXT NOT NULL,
  match_tags TEXT[] DEFAULT '{}',
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入话术模板（recognizer ID）
INSERT INTO script_templates (persona, lang, content, match_tags) VALUES
('recognizer', 'id', 'Bang, liat badge LV lo langsung auto respect. Jarang ada yang se-gigih ini di TikTok', ARRAY['热舞','颜值','大方','所有品类']),
('recognizer', 'id', 'Kak, lo tipe penonton yang bikin streamer semangat live. Jarang nemu yang loyal kaya gini', ARRAY['热舞','颜值','所有品类']),
('recognizer', 'id', 'Gue sering liat username lo di berbagai live. Legend banget sih, gak banyak yang bisa konsisten', ARRAY['热舞','颜值','所有品类']),
('recognizer', 'id', 'Respect banget sama loyalitas lo. Creator kecil notice kok supporter kaya lo', ARRAY['所有品类']),
('recognizer', 'id', 'Kak, lo bukan penonton biasa. Lo investor di dunia live streaming', ARRAY['大方','超级VIP','所有品类']),
('recognizer', 'id', 'Lo tipe yang bikin TikTok live jadi seru. Gak banyak yang punya taste kaya lo', ARRAY['热舞','颜值','所有品类']),
('recognizer', 'id', 'Salut! Dari sekian banyak penonton, cuma beberapa yang se-loyal lo. Lo beda level', ARRAY['所有品类']),
('recognizer', 'id', 'Username lo udah gue hafal. Setiap live lo selalu ada. Loyalitas level dewa', ARRAY['所有品类']),
('recognizer', 'id', 'Kak, gak kebayang live tanpa penonton kaya lo. Bener-bener backbone komunitas', ARRAY['所有品类']),
('recognizer', 'id', 'Lo adalah alasan creator kecil terus semangat. Gak banyak yang ngerti, tapi lo ngerti', ARRAY['所有品类']),
-- recognizer ZH
('recognizer', 'zh', '大哥，你在这个平台就是传说级别的存在。每次看到你的等级徽章，小主播们都得仰望', ARRAY['热舞','颜值','所有品类']),
('recognizer', 'zh', '刚在别人直播间看到你的榜一了。说实话，你这么支持创作者的没几个', ARRAY['大方','超级VIP','所有品类']),
('recognizer', 'zh', '你的LV徽章走在哪都是焦点。像你这样的大哥，值得最好的直播体验', ARRAY['所有品类']),
('recognizer', 'zh', '大哥，你的ID在这个平台就是品质保证。走到哪都有人认识', ARRAY['所有品类']),
('recognizer', 'zh', '大哥，你刷的不是礼物，是对创作者梦想的支持。这点小主播都懂', ARRAY['所有品类']),
('recognizer', 'zh', '在这个平台混久了，一眼就能看出谁是真正的大哥。你就是那种', ARRAY['所有品类']),
('recognizer', 'zh', '你的等级徽章往那一放，不用说话就有气场。这就是底蕴', ARRAY['所有品类']),
('recognizer', 'zh', '大哥，你给小主播带来的不只是礼物，更是继续直播的勇气', ARRAY['所有品类']),
-- recognizer EN
('recognizer', 'en', 'Just saw your badge in another stream. Legend status confirmed', ARRAY['所有品类']),
('recognizer', 'en', 'You are the type of viewer that makes streaming worth it. Rare to find this loyal', ARRAY['所有品类']),
('recognizer', 'en', 'Spotted your LV badge across TikTok. Not many supporters like you', ARRAY['所有品类']),
('recognizer', 'en', 'Your loyalty to creators is unmatched. People like you keep the platform alive', ARRAY['所有品类']),
-- curious ID
('curious', 'id', 'Kak, gue liat video lo, lo kayaknya orangnya dalem. Cocok kalo ngobrol santai', ARRAY['热舞','颜值','唱歌']),
('curious', 'id', 'Kak, dari cara lo comment di live orang, gue tau lo beda. Mampir kalo sempet ya', ARRAY['热舞','颜值','所有品类']),
('curious', 'id', 'Gue penasaran sama vibe lo. Dari preview doang udah keliatan beda', ARRAY['颜值','唱歌','脱口秀']),
-- curious ZH
('curious', 'zh', '刚看到你的主页，感觉你是个有故事的人。等会来我直播间坐坐？', ARRAY['热舞','颜值','唱歌']),
('curious', 'zh', '刷到你的主页，感觉和普通主播不一样。有点好奇你的故事', ARRAY['所有品类']),
-- challenger ID
('challenger', 'id', 'Bang, denger-denger lo jago banget di live dance. Ada yang bilang lo juara. Beneran?', ARRAY['热舞','竞技']),
('challenger', 'id', 'Kak, kata temen gue lo raja nya gift di live musik. Pengen liat langsung', ARRAY['唱歌']),
('challenger', 'id', 'Ada yang bilang lo hardest gifter di TikTok Indonesia. Kalo liat badge sih percaya', ARRAY['大方','超级VIP','所有品类']);

CREATE INDEX IF NOT EXISTS idx_script_templates_persona ON script_templates(persona);
CREATE INDEX IF NOT EXISTS idx_script_templates_lang ON script_templates(lang);