/**
 * WhaleBell Vanity Sniper API v2.0
 * 化妆间狙击模式 — 话术引擎 + 标签匹配 + Deep Link
 */
const express = require('express');
const router = express.Router();

// ============================================================
// 话术模板引擎 — 按大哥人格类型匹配
// ============================================================
// 每条模板最多80字符，适合TikTok评论区
const COMMENT_TEMPLATES = {
  recognition: {
    matchTags: ['热舞', '颜值', '大方', '超级VIP', '重量级', '所有品类'],
    templates: {
      id: [
        "Bang, liat badge LV lo langsung auto respect. Jarang ada yang se-gigih ini di TikTok 😎",
        "Kak, lo tipe penonton yang bikin streamer semangat live. Jarang nemu yang loyal kaya gini 💯",
        "Gue sering liat username lo di berbagai live. Legend banget sih, gak banyak yang bisa konsisten 🙌",
        "Respect banget sama loyalitas lo. Creator kecil kaya gue notice kok supporter kaya lo 👑",
        "Badge LV lo tuh udah kaya crown. Auto respect setiap kali liat di live orang 🫡",
        "Kak, lo bukan penonton biasa. Lo tuh investor di dunia live streaming. Apreciate banget 💎",
        "Setiap kali liat username lo di live, gue selalu mikir ini orang pasti royal. Terbukti ⚡",
        "Lo tipe yang bikin TikTok live jadi seru. Gak banyak yang punya taste kaya lo 🔥",
        "Salut! Dari sekian banyak penonton, cuma beberapa yang se-loyal lo. Lo beda level 🏆",
        "Gue baru mulai live, tapi udah tau username kaya lo itu jarang. Respect dari gue personal 🙏",
        "Kalo semua penonton kaya lo, dunia streaming bakal beda banget. Legend! 💫",
        "Bang, lo bukan sekadar penonton. Lo bagian dari ekosistem. Creator kecil respect banget 🌟",
        "Gue notice supporter kaya lo dari awal. Konsisten dan selalu support. Rare banget 💝",
        "Username lo udah gue hafal. Setiap live lo selalu ada. Loyalitas level dewa 🎯",
        "Kak, gak kebayang live tanpa penonton kaya lo. Bener-bener backbone komunitas 👊",
        "Lo adalah alasan creator kecil terus semangat. Gak banyak yang ngerti, tapi lo ngerti 💡",
        "Dari ratusan penonton, lo yang paling gue notice. Selalu support, selalu ada 🎪",
        "Kak, badge lo tuh udah kayak sertifikat kehormatan. Yang punya pasti orangnya asik 🌈"
      ],
      zh: [
        "大哥，你在这个平台就是传说级别的存在。每次看到你的等级徽章，小主播们都得仰望 😎",
        "刚在别人直播间看到你的榜一了。说实话，你这么支持创作者的没几个 🥂",
        "你的LV徽章走在哪都是焦点。像你这样的大哥，值得最好的直播体验 ✨",
        "大哥，你的ID在这个平台就是品质保证。走到哪都有人认识 👑",
        "说实话，在这个平台上像你这样的大哥，我数不出三个。真的尊重 💎",
        "你的每一次出现都让小主播们兴奋。这就是实力的象征 🔥",
        "大哥，你刷的不是礼物，是对创作者梦想的支持。这点小主播都懂 🙏",
        "在这个平台混久了，一眼就能看出谁是真正的大哥。你就是那种 🎯",
        "你的等级徽章往那一放，不用说话就有气场。这就是底蕴 💫",
        "大哥，你给小主播带来的不只是礼物，更是继续直播的勇气 🌟",
        "看你在别人直播间的榜一，就知道你这人讲究。值得深交 🤝",
        "大哥就是大哥，气场不一样。每次出现都知道今晚稳了 💪",
        "你走过的直播间，主播都能记住你。这就是传说中的存在感 ⚡",
        "真心敬你是条汉子。默默支持创作者，不张扬但有实力 🦁",
        "在抖音混，谁不认识你这号人物。大哥级别的存在，走到哪都发光 💡",
        "大哥来了，直播间气氛立马不一样。这就是你的魅力 🌈",
        "每一个被你支持过的主播都知道，你是真的懂直播的人 🎪",
        "不是所有高等级的都叫大哥，你是真正有品位的那一种 🏆"
      ],
      en: [
        "Just saw your badge in another stream. Legend status confirmed. Creators notice supporters like you 👑",
        "You're the type of viewer that makes streaming worth it. Rare to find this loyal 💯",
        "Spotted your LV badge from across TikTok. Not many supporters like you out there 🫡",
        "Your loyalty to creators is unmatched. People like you make this platform special 💎",
        "Every streamer who's had you in their room knows your name. That's real influence 🔥",
        "You're not just a viewer, you're an investor in creativity. Massive respect 🙏",
        "Badge like yours tells a story. And every creator wants that story in their room 🌟",
        "Some people watch, you invest. That's the difference between a viewer and a king 👊",
        "Your presence alone changes the energy of a stream. That's power 💫",
        "Been streaming for a while, people like you are why I keep going 🎯",
        "Your name carries weight in every room. That's earned, not given 💪",
        "Real recognize real. And you're as real as it gets on this platform 🦁",
        "Creator community needs more people like you. Generous and consistent 🎪",
        "You don't just watch, you elevate. Every room you enter gets better 🌈",
        "Watching you support creators is inspiring. This is what community looks like 💡",
        "Your badge doesn't just show level, it shows character. That's rare 🔮",
        "Every time I see your name in a stream, I know that creator is in good hands 🤝",
        "Legends don't need introduction. Your badge speaks for itself 🏆"
      ]
    }
  },
  mystery: {
    matchTags: ['搞笑', '脱口秀', '夜生活', '情感', '讲故事'],
    templates: {
      id: [
        "Kak, bentar lagi ada yang spesial nih jam 8 malam. Mampir aja, siapa tau cocok vibes-nya 😏",
        "Malam ini ada sesuatu yang berbeda. Gak bakal nyesel mampir. Trust me 🌙",
        "Ada surprise kecil nanti malam. Gak bakal gue spoiler, tapi seriusan seru ✨",
        "Kak, jangan tanya apa. Pokoknya malam ini beda dari biasanya. Penasaran? Mampir aja 🎭",
        "Tonight is different. Gue udah siapin sesuatu special. Cuma beberapa orang yang tau 🎪",
        "Jam 8 nanti ada kejutan. Yang dateng gak bakal nyesel. Guaranteed 💫",
        "Kak, vibes lo chill banget. Malam ini gue live dengan vibe yang sama. Dateng ya? 🌿",
        "Kalo lo suka konten yang gak mainstream, malam ini pas banget buat lo 🎯",
        "Gak akan gue kasih tau detailnya. Tapi yang pasti berbeda dari biasanya. Curious? 😉",
        "Malam ini gue akan reveal sesuatu yang udah lama gue siapin. Jangan sampe ketinggalan ⚡",
        "Ada guest star spesial malam ini. Gak bisa gue sebutin sekarang. Pokoknya seru 🔥",
        "Kak, lo orangnya curious kan? Malam ini gue ada sesuatu yang bakal bikin lo penasaran 🎲",
        "Bulan ini ada tema spesial. Malam ini episode pertamanya. Jangan sampe ketinggalan 🌙",
        "Gue gak pernah bilang ini ke siapapun. Lo orang pertama yang gue kasih tau. Malam ini ✨",
        "Kak, malam ini beda. Gue udah prepare seminggu buat ini. Trust the process 🎬",
        "Sesuatu yang belum pernah gue lakuin sebelumnya. Tonight is the night 🌟"
      ],
      zh: [
        "今晚8点有场特别的。来看一眼呗，说不定跟你的气场很搭 😏",
        "今晚准备了点不一样的。看了你的主页，感觉你会喜欢。不见不散 🌙",
        "刚看完你视频，直觉告诉我你会喜欢今晚的场子。留个悬念 ✨",
        "大哥，今晚有个惊喜，不剧透。但保证你来了不后悔 🎭",
        "今晚的主题是你喜欢的风格。别问我怎么知道的，来了就懂了 🎪",
        "今晚的节目单我自己都期待。应该会是你喜欢的类型 💫",
        "大哥，你的品味我是懂的。今晚这场就是为你这类人准备的 🌿",
        "不是什么人都适合今晚的主题。但我看你就很对路 🎯",
        "今晚我请了个特别嘉宾。不能说名字，但绝对是你认识的 😉",
        "在抖音混这么久，今晚这场我会记得很久。你也应该来 ⚡",
        "大哥，直觉告诉我你会是今晚的VIP。别让我失望 🔥",
        "今晚的内容我准备了一个月。第一批观众我想是你这样的人 🎲",
        "你是我今天第一个邀请的人。今晚这场是为你准备的 🌙",
        "今晚8点，有一场不一样的直播。看了我的主页你就懂 ✨",
        "有些事情说出来就不灵了。但今晚你来了就知道。相信我 🎬",
        "今晚我们不聊常规。来点深度的话题。你会感兴趣的 🌟"
      ],
      en: [
        "Something special tonight at 8PM. Your vibe tells me you'd enjoy this 😏",
        "Got a feeling tonight's stream matches your energy. Drop by and see 🌙",
        "Just watched your content. Something tells me you'd vibe with tonight ✨",
        "Not gonna spoil it. But tonight is different from anything I've done before 🎭",
        "Tonight's theme was inspired by people like you. You'll see what I mean 🎪",
        "There's a surprise guest tonight. Can't say who. But trust me, it's worth it 💫",
        "You seem like someone who appreciates the unexpected. Tonight's for you 🎯",
        "Tonight I'm trying something new. You should be here to witness it 🔥",
        "If you like deep, thoughtful content, tonight's stream is made for you 🌿",
        "First time doing this kind of stream. Want the right people in the room 🌟",
        "Tonight's topic is something you've probably thought about. Let's discuss 🎲",
        "Not everyone will get tonight's theme. But I think you will ⚡",
        "Prepared something special this week. Tonight is the reveal 🎬",
        "Your profile tells me you're curious. Tonight will satisfy that curiosity ✨",
        "I rarely do streams like tonight's. Special audience for a special night 🌙",
        "No spoilers. Just be there at 8. You'll thank me later 😉"
      ]
    }
  },
  challenge: {
    matchTags: ['竞技', '游戏', '车', '挑战', '互动', '电玩'],
    templates: {
      id: [
        "Kak, keliatan orangnya asik. Berani taruhan? Tebak lagu pembuka gue nanti malem 😂",
        "Challenge nih: lo vs gue. Tebak berapa orang yang join live gue. Paling deket menang 🏆",
        "Kak, lo kayaknya jago nebak. Coba tebak tema live gue malam ini. Berani? 🎮",
        "Satu challenge kecil: kalo lo bisa nebak guest gue malam ini, gue kasih shoutout 🎯",
        "Lo keliatan kompetitif. Malam ini gue ada game. Hadiahnya spesial. Join? 🔥",
        "Kak, gue challenge lo. Kalo lo bisa bikin gue ketawa dalam 1 menit, lo menang 😂",
        "Siapa yang paling jago nebak? Malam ini gue bikin quiz berhadiah. Lo harus ikut 🎲",
        "Lo vs gue, one on one. Tebak lagu yang bakal gue nyanyiin. Kalo bener, gue kasi reward ⚡",
        "Kak, dari profile lo, gue tau lo suka tantangan. Malam ini gue ada sesuatu 🎪",
        "Berani ambil challenge? Malam ini gue bakal test penonton. Hadiahnya gede 🏅",
        "Lo jago main game? Malam ini gue main game yang lo pasti bisa. Ayo lawan gue 🎮",
        "Tebak dalam 3 kali kesempatan. Kalo bener, lo dapet akses VIP gratis malam ini 🎫",
        "Kak, lo keliatan jago. Malam ini challenge spesial. Berani taruhan kecil? 💰",
        "Gue tantang lo. Tebak lagu pertama gue nanti malem. Lo pasti gak bakal nyangka 🎵",
        "Satu pertanyaan: lo berani gak lawan gue di live malam ini? Taruhannya seru 😏",
        "Challenge: kalo lo bisa jawab 3 pertanyaan gue, gue kasih hadiah spesial 🎁"
      ],
      zh: [
        "大哥，看你主页就知道你是爱玩的人。敢不敢打个赌？猜中开场曲有奖 😂",
        "一个小挑战：猜猜今晚我直播间多少人？赢了有惊喜。输了也得来 🏆",
        "看你视频就知道你不服输。今晚来直播间，给你个专属挑战 🎮",
        "大哥，听说你什么都懂。今晚来回答我三个问题，答对有奖 🎯",
        "不是谁都能接我的挑战。但看了你的主页，感觉你行 🔥",
        "今晚直播间玩个游戏，第一名有专属奖励。你应该参加 🎲",
        "大哥，敢不敢跟我比一把？题目你定，输了请客 😂",
        "今晚有场PK赛。我看好你来参加。赢了全场喊你大哥 ⚡",
        "你的主页透露了你是高手。今晚有个比赛，缺你这样的人才 🎪",
        "大哥，约个挑战？今晚直播间，题目很简单但需要胆量 🏅",
        "看你视频觉得你技术不错。今晚来展示一下，让大家看看 🎮",
        "三条命，猜中今晚的主题。赢了VIP体验卡送你 🎫",
        "大哥，今天有没有胆量接受我的战书？题目随你挑 💰",
        "我赌你猜不中我今天要唱的第一首歌。赢了我给你做一个月捧场 🎵",
        "今晚有个刺激的游戏环节。我觉得你会是冠军候选人 😏",
        "大哥，玩个游戏？如果你赢了，我满足你一个合理要求 🎁"
      ],
      en: [
        "You look like someone who loves a challenge. Guess my opening song and win 🎮",
        "Quick bet: guess tonight's stream theme. Winner gets a free song request 😏",
        "Your profile screams competitive. Challenge: guess my viewer count. Closest wins 🏆",
        "One challenge: if you can guess my special guest, you get VIP treatment tonight 🎯",
        "You vs me. 3 questions. Get them all right and you win a prize 🔥",
        "I challenge you: make me laugh in 60 seconds. If you win, I'll do whatever you want 😂",
        "Tonight's stream has a game element. Winner gets bragging rights and a prize 🎲",
        "Think you can beat me? Tonight we play. Audience vs me. You should join ⚡",
        "I've never been beaten in this game. You might be the first. Prove me wrong 🎪",
        "One chance. Guess what's happening tonight. Get it right and I'll shout you out 🏅",
        "You look like a gamer. Tonight I'm streaming a game you'd crush. Come play 🎮",
        "Bet you can't guess tonight's surprise. Winner gets exclusive access 🎫",
        "Challenge accepted? Tonight I'm taking on the audience. You first 💰",
        "3 guesses. If you nail what I'm doing tonight, you win big 🎵",
        "Competitive? So am I. Tonight's stream is a battle. Be there 😏",
        "You seem like someone who doesn't back down. Tonight's challenge is for you 🎁"
      ]
    }
  },
  curiosity: {
    matchTags: ['唱歌', '弹唱', '民谣', '音乐', '乐器', '文艺', '旅行', '美食', '生活'],
    templates: {
      id: [
        "Kak, profile lo aesthetic banget. Kayanya selera kita mirip deh. Mampir malam ini 🌸",
        "Dari postingan lo, kayaknya kita satu frekuensi. Malam ini gue live, mampir yuk 🎵",
        "Suka banget sama konten lo. Tenang, chill, authentic. Malam ini gue live serupa 🌿",
        "Kak, taste musik lo keren. Malam ini gue bakal nyanyi lagu favorit lo. Dateng? 🎤",
        "Vibes lo tuh artsy gitu. Malam ini gue live dengan vibe yang sama persis 🎨",
        "Konten lo bikin gue tenang. Malam ini gue bakal live santai kaya gitu. Cocok buat lo 🧘",
        "Kayaknya kita punya selera yang sama. Makanan, musik, travel. Malam ini ngobrol? 🍜",
        "Kak, lo tipe yang deep. Malam ini gue bahas topik yang lo pasti suka. Join 📚",
        "Aesthetic lo beda dari yang lain. Malam ini tema live gue terinspirasi dari profile lo ✨",
        "Dari cara lo posting, gue tau lo orangnya asik. Malam ini vibe-nya chill 🌙",
        "Gue browsing profile lo dan langsung suka. Malam ini gue live, please mampir 🎭",
        "Lo keliatan orang yang menghargai seni. Malam ini gue ada performance spesial 🎪",
        "Kak, koleksi travel lo keren. Malam ini tema live gue tentang perjalanan. Sharing yuk ✈️",
        "Profile lo aesthetic, konten lo meaningful. Malam ini gue live dengan vibe lo 🌈",
        "Gue jarang liat profile seasik punya lo. Malam ini live gue bakal se-asik itu 🎯",
        "Lo tipe orang yang gue pengen ngobrol panjang. Malam ini live gue, yuk diskusi 💬"
      ],
      zh: [
        "大哥，你主页审美绝了。感觉我们品味很对路。今晚来坐坐 🌸",
        "看了你的内容，觉得你是那种懂生活的人。今晚的主题你应该喜欢 🎵",
        "从你视频能看出你是个有故事的人。今晚直播间，想听听你的看法 🌿",
        "大哥，听你的歌单就知道你有品味。今晚我唱你喜欢的歌 🎤",
        "你的生活态度我很欣赏。不急不躁，有格调。今晚来聊聊 🎨",
        "你发的每一条内容都很有质感。今晚我的直播也是这种风格 🧘",
        "大哥，感觉我们的兴趣爱好很像。音乐、旅行、美食。今晚来唠唠 🍜",
        "看你视频觉得你是个懂行的人。今晚有话题想跟你讨论 📚",
        "你的主页给我一种很舒适的感觉。今晚直播也是这个调调 ✨",
        "从你分享的内容能看出你的生活态度。想跟你这样的人做朋友 🌙",
        "大哥，你是我见过的少有的有品位的人。今晚别错过 🎭",
        "你的主页就是我的审美教科书。今晚直播风格会是你喜欢的 🎪",
        "大哥，看你旅行的视频很治愈。今晚聊聊你去过的地方 ✈️",
        "你的生活方式就是我向往的。今晚来直播间分享你的经验 🌈",
        "大哥，你的内容让人感觉很真实。这样的主播不多了。今晚见 🎯",
        "看过你很多视频，觉得我们应该能聊得来。今晚有空吗 💬"
      ],
      en: [
        "Your profile aesthetic is on point. Feel like we share the same taste. Tonight 🌸",
        "From your posts, I can tell we're on the same wavelength. Drop by tonight 🎵",
        "Love your content. Chill, authentic, real. Tonight's stream has similar energy 🌿",
        "Your music taste is incredible. Tonight I'm playing songs you'd love. Come listen 🎤",
        "You have an artistic vibe. Tonight's stream is all about art and creativity 🎨",
        "Your content brings me peace. Tonight's stream is that kind of vibe 🧘",
        "I think we share similar interests. Music, food, travel. Let's chat tonight 🍜",
        "You seem like a deep thinker. Tonight's topic will intrigue you 📚",
        "Your aesthetic is unique. Tonight's stream was inspired by profiles like yours ✨",
        "The way you post tells me you're genuine. Tonight's vibe matches that 🌙",
        "Been browsing your profile and I'm impressed. Join my stream tonight 🎭",
        "You appreciate art. Tonight I have a special performance planned 🎪",
        "Your travel photos are amazing. Tonight's theme is all about journeys ✈️",
        "Your profile is aesthetic, your content is meaningful. Tonight reflects that 🌈",
        "Rarely find profiles as interesting as yours. Tonight's stream is your vibe 🎯",
        "You're the type of person I'd love to have a long conversation with. Tonight? 💬"
      ]
    }
  }
};

// 标签→模板类型 映射表// 标签→模板类型 映射表
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

function getLangForRegion(regionStr) {
  if (!regionStr) return 'id';
  var r = regionStr.toLowerCase();
  if (r.includes('台湾') || r.includes('taiwan') || r.includes('中国') || r.includes('china') || r.includes('中文')) return 'zh';
  if (r.includes('马来西亚') || r.includes('malaysia') || r.includes('印度尼西亚') || r.includes('indonesia') || r.includes('印尼')) return 'id';
  if (r.includes('日本') || r.includes('japan') || r.includes('韩国') || r.includes('korea')) return 'en';
  return 'id'; // default Indonesian/Malay for SEA
}

function getDeepLinks(username) {
  return {
    profile: `tiktok://user/${username}`,
    web: `https://www.tiktok.com/@${username}`,
    // 一键唤醒 App 的 Universal Link
    universal: `https://www.tiktok.com/@${username}?_t=whalebell`
  };
}

// ============================================================
// Supabase 真实数据源 (fallback to mock)
// ============================================================
const { createClient } = require('@supabase/supabase-js');
let supabase = null;
try {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);
} catch(e) { console.error('Supabase init error:', e.message); }


// WhaleSense data source (312K whales)
async function getWhalesFromWhaleSense(limit) {
  var wsUrl = 'https://kknlamwvjfyvethqromz.supabase.co';
  var wsKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbmxhbXd2amZ5dmV0aHFyb216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3Nzc4OTYsImV4cCI6MjA2NDM1Mzg5Nn0.tS36FrpNW4xMAU2RBDRf3d8Z1Q0-ocS4c__Pa6A';
  try {
    var https = require('https');
    var u = new URL(wsUrl + '/rest/v1/whales?select=*&level=gte.20&limit=2000');
    var data = await new Promise(function(resolve, reject) {
      https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { apikey: wsKey, Authorization: 'Bearer ' + wsKey }}, function(res) {
        var body = ''; res.on('data', function(c) { body += c; }); res.on('end', function() { try { resolve(JSON.parse(body)); } catch(e) { resolve(null); } });
      }).on('error', reject);
    });
    if (!Array.isArray(data) || data.length === 0) return null;
    // Shuffle and random window
    for (var i = data.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = data[i]; data[i] = data[j]; data[j] = x; }
    var maxStart = Math.max(0, data.length - limit);
    var start = Math.floor(Math.random() * maxStart);
    data = data.slice(start, start + limit);
    return data.map(function(w) { return wsMapToTarget(w); });
  } catch(e) { return null; }
}

function wsMapToTarget(w) {
  var region = w.region || 'N/A';
  var whaleLang = getLangForRegion(region) || 'id';
  var tags = w.level >= 40 ? ['high_level','vip'] : w.level >= 30 ? ['high_level'] : [];
  if (w.total_gifts > 50000) tags.push('often_gifter');
  var template = matchTemplate(tags, whaleLang);
  var links = getDeepLinks(w.username);
  return {
    id: w.id || w.username, username: w.username, nickname: w.nickname || w.username,
    level: w.level || 0, tags: tags, persona: tags[1] || tags[0],
    lastActive: '活跃', comment: template.comment, templateType: template.templateType,
    deepLinks: links, videoUrl: links.web, totalCoins: w.total_gifts || 0,
    region: region, roomsVisited: w.alert_count || 0
  };
}


// Filter helpers
function hasChinese(txt) { return /[\u4e00-\u9fff]/.test(txt || ''); }
function isFemaleWhale(w) {
  var txt = ((w.nickname || '') + ' ' + (w.username || '')).toLowerCase();
  var femaleWords = ['girl', 'baby', 'princess', 'queen', 'lady', 'miss', 'ibu',
    'cewek', 'putri', 'cwe', 'woman', 'female', 'sista', 'bunda', 'mama', 'gadis',
    'perempuan', 'cewe', 'mbak', 'beb', 'mommy', 'mom', 'wife', 'aunt', 'nenek',
    'love', 'sis', 'sister', 'sweet', 'beauty', 'pretty', 'cantik', 'ayu', 'indah',
    'wati'];
  return femaleWords.some(function(w) { return txt.indexOf(w) >= 0; });
}

async function getWhalesFromSupabase(limit = 10, category = null, region = null) {
  if (!supabase) return null;
  try {
    // Simple query, no contains() filter (encoding issues with CJK characters)
    let { data, error } = await supabase
      .from('whale_profiles')
      .select('*')
      .gte('level', 20)
      .order('level', { ascending: false })
      .range(0, 1999);
    if (error) { console.error('Supabase query error:', error.message, error.details); return null; }
    if (!data || data.length === 0) { console.log('No data from Supabase'); return null; }
    var totalFetched = data.length;
    // Random offset: skip random number of whales for variety
    var skip = Math.floor(Math.random() * Math.max(0, totalFetched - 200));
    data = data.slice(skip, skip + 200);
    // Priority: Malaysia & Indonesia whales first
    var priority = ['马来西亚', '印度尼西亚', 'Indonesia', 'Malaysia'];
    var preferred = data.filter(function(w) { return priority.indexOf(w.region) >= 0; });
    var others = data.filter(function(w) { return priority.indexOf(w.region) < 0; });
    data = preferred.concat(others);
    // Gender + language filters
    data = data.filter(function(w) { return !hasChinese(w.nickname) && !hasChinese(w.username); });
    data = data.filter(function(w) { return !isFemaleWhale(w); });
    // Category filter
    if (category && STREAMER_CATEGORIES[category]) {
      var matchTags = STREAMER_CATEGORIES[category].targetTags;
      data = data.filter(function(w) { var tags = w.tags || []; return tags.some(function(t) { return matchTags.indexOf(t) >= 0; }); });
    }
    // Region filter
    if (region) {
      data = data.filter(function(w) { var r = w.region || ''; return r.indexOf(region) >= 0; });
    }
    // Shuffle
    for (var i = data.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = data[i]; data[i] = data[j]; data[j] = x; }
    console.log('Supabase returned:', data.length, 'whales');
    return data;
  } catch(e) { console.error('Supabase fetch error:', e.message); return null; }
}

function supabaseWhaleToTarget(w, lang) {
  var whaleLang = getLangForRegion(w.region) || lang || 'id';
  const template = matchTemplate(w.tags || ['high_level'], whaleLang);
  const links = getDeepLinks(w.username);
  return {
    id: w.id, username: w.username, nickname: w.nickname || w.username,
    level: w.level || 0, tags: w.tags || [], persona: w.persona,
    lastActive: 'Online', comment: template.comment, templateType: template.templateType,
    deepLinks: links, videoUrl: links.web, totalCoins: w.total_coins,
    region: w.region, roomsVisited: w.rooms_visited
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
router.get('/targets', async (req, res) => {
  const { userId, limit, category, lang } = req.query;
  const count = parseInt(limit) || 10;
  const language = lang || 'id';

  // Try Supabase first
  var filterRegion = req.query.region || null;
  rawTargets = await getWhalesFromWhaleSense(count);
  if (!rawTargets || rawTargets.length < 5) rawTargets = await getWhalesFromSupabase(count, category, filterRegion);
  
  // Fallback to mock
  if (!rawTargets || rawTargets.length < 5) {
    rawTargets = TARGETS;
  } else {
    rawTargets = rawTargets.map(function(w) { return supabaseWhaleToTarget(w, language); });
    // Score and sort
    let scored = rawTargets.map(t => {
      let score = t.level * 10 + (t.isPremium ? 50 : 0);
      if (category && STREAMER_CATEGORIES[category]) {
        const cat = STREAMER_CATEGORIES[category];
        const matchCount = (t.tags || []).filter(tag => cat.targetTags.includes(tag)).length;
        score += matchCount * 15 * cat.weight;
      }
      return { ...t, score };
    });
    scored.sort((a, b) => b.score - a.score);
    
    return res.json({
      success: true,
      version: 10,
      source: 'supabase',
      total: rawTargets.length,
      targets: scored.slice(0, count),
      categories: Object.entries(STREAMER_CATEGORIES).map(([k, v]) => ({ id: k, label: v.label })),
      tip: { id: 'Like + komen, 30% mampir!', zh: '点赞+评论，30%概率进直播间！', en: 'Like+comment, 30% visit!' }
    });
  }

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

module.exports = router;
