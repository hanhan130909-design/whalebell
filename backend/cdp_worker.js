/**
 * WhaleBell CDP Worker — 本地 Chrome 监控脚本
 * 
 * 独立运行：发现直播间 → 连接 webcast → 抓取用户数据 → 写入 Supabase
 * 用法：node cdp_worker.js [maxRooms]
 */

const { CDPPool } = require('./src/cdp_pool');
const { saveWhaleAlert } = require('./src/database');

const MAX_ROOMS = parseInt(process.argv[2]) || 3;
const USER_ID = process.env.CDP_USER_ID || 'cdp_worker';
const SCAN_INTERVAL = parseInt(process.env.CDP_SCAN_INTERVAL) || 300000; // 5分钟重新寻房

const THRESHOLD = 0;
const COOLDOWN = 120;
const alertedUsers = new Map();

async function main() {
  console.log('🐋 WhaleBell CDP Worker');
  console.log(`   Max rooms: ${MAX_ROOMS}`);
  console.log(`   Scan interval: ${SCAN_INTERVAL/1000}s`);
  console.log('');

  const pool = new CDPPool();
  let running = true;

  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    running = false;
    await pool.shutdown();
    process.exit(0);
  });

  while (running) {
    try {
      // Discover and monitor
      console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Scanning for live rooms...`);
      const rooms = await pool.discoverRooms({ maxRooms: 10, checkWebcast: true });
      const liveRooms = rooms.filter(r => r.hasWebcast);
      
      if (liveRooms.length === 0) {
        console.log('  No live rooms found. Retrying in 60s...');
        await sleep(60000);
        continue;
      }

      console.log(`  Found ${liveRooms.length} live rooms. Starting ${Math.min(MAX_ROOMS, liveRooms.length)} monitors...`);

      for (const room of liveRooms.slice(0, MAX_ROOMS)) {
        const status = pool.getStatus();
        if (status.find(s => s.roomName === room.username)) {
          console.log(`  @${room.username}: already watching`);
          continue;
        }

        await pool.startWatching(room.username, {
          onConnected(name) {
            console.log(`  ✅ @${name}: connected`);
          },
          onEvent: async (name, eventType, data) => {
            try {
              const user = data.user || data.sender || {};
              const username = (user.uniqueId || user.userId?.toString() || '').replace(/^@/, '');
              if (!username) return;

              const nickname = user.nickname || username;
              
              // Level extraction
              let level = 0;
              if (user.topVipNo) level = parseInt(user.topVipNo) || 0;
              if (!level && user.userBadges?.[0]) {
                level = parseInt(user.userBadges[0].level || user.userBadges[0].badgeLevel) || 0;
              }
              if (!level && user.badgeImageList?.[0]) {
                level = parseInt(user.badgeImageList[0].level || user.badgeImageList[0].badgeLevel) || 0;
              }
              if (!level && user.level) level = parseInt(user.level) || 0;
              if (!level && data.topVipNo) level = parseInt(data.topVipNo) || 0;
              if (!level && data.level) level = parseInt(data.level) || 0;

              if (level < THRESHOLD) return;

              // Cooldown
              const ck = `${name}:${username}`;
              const now = Date.now();
              if (alertedUsers.has(ck) && now - alertedUsers.get(ck) < COOLDOWN * 1000) return;
              alertedUsers.set(ck, now);

              // Gift calculation
              let totalGifts = 0;
              if (eventType === 'WebcastGiftMessage') {
                totalGifts = (parseInt(data.diamondCount) || 0) * (parseInt(data.repeatCount) || 1);
              }

              await saveWhaleAlert({
                user_id: USER_ID,
                username,
                nickname,
                level,
                room_id: name,
                total_gifts: totalGifts,
                profile_url: user.profilePicture?.urls?.[0] || '',
                event_type: eventType,
                source: 'cdp-worker',
                timestamp: new Date().toISOString()
              }).catch(e => {});

              const short = eventType.replace('Webcast','').replace('Message','').toLowerCase();
              if (level >= 20 || short === 'gift') {
                console.log(`  🐋 ${short}: ${username} LV${level} in @${name}`);
              }
            } catch(e) {}
          },
          onError(name, err) {
            const msg = err?.message || '';
            if (!msg.includes('null') && !msg.includes('default')) {
              console.error(`  ❌ @${name}: ${msg.slice(0, 80)}`);
            }
          },
          onLiveCheck(name) {
            console.log(`  📡 @${name}: LIVE`);
          }
        });
      }

      // Wait before next scan
      console.log(`\n⏱️  Next scan in ${SCAN_INTERVAL/1000}s...`);
      await sleep(SCAN_INTERVAL);

    } catch (err) {
      console.error('Worker error:', err.message);
      await sleep(30000);
    }
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
