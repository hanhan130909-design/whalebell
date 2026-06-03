

  // ============================================================
  // i18n Trilingual Support
  // ============================================================
  const i18n = {
    zh: { badge: '🎯 化妆间狙击', prep: '距离开播还有', prep_sub: '化妆准备时间', quota: '今日剩余', target: '个目标', vip: '💎 VIP', 
      total: '目标总数', done: '已完成', free: '免费配额', maxlv: '最高等级', tip: '点赞+评论大哥视频',
      tip2: '开播后大哥有30%概率进你直播间！', section: '今日狙击目标', sort: '按等级排序',
      copy: '复制', locked: '已锁定', open_tiktok: '跳转TikTok', mark: '标记完成', done_btn: '已狙击',
      unlock: '邀请解锁', unlock_hint: '分享给1人=解锁2个大哥', hidden: '🔒 大哥已隐藏',
      share_title: '邀请姐妹解锁', share_sub: '邀请1人各+2配额！', share_btn: '分享链接',
      redeem_title: '使用邀请码', redeem_sub: '兑换双方各+2名额', upgrade_title: '开通会员',
      upgrade_sub: '每天50个精准大哥', weekly: '周卡29K', monthly: '月卡79K',
      invite: '👯 邀请+2', redeem: '🔑 兑换码', upgrade: '💎 升级', ok_btn: '好的！', stat_total: '目标总数', stat_done: '已完成', stat_free: '免费配额', stat_maxlv: '最高等级' },
    en: { badge: '🎯 Vanity Sniper', prep: 'Countdown', prep_sub: 'Prep time · Snipe 10 whales', quota: 'Remaining', target: 'targets', vip: '💎 VIP',
      total: 'Total targets', done: 'Done', free: 'Free quota', maxlv: 'Max LV', tip: 'Like + comment their video',
      tip2: '30% chance they visit your stream!', section: "Today's Targets", sort: 'By level',
      copy: 'Copy', locked: 'Locked', open_tiktok: 'Open TikTok', mark: 'Mark done', done_btn: 'Done',
      unlock: 'Unlock', unlock_hint: 'Share with 1 friend = unlock 2', hidden: '🔒 Hidden',
      share_title: 'Invite friends', share_sub: 'Invite 1 friend, both +2!', share_btn: 'Share link',
      redeem_title: 'Redeem code', redeem_sub: 'Both get +2 targets!', upgrade_title: 'Premium',
      upgrade_sub: '50 precise targets daily', weekly: 'Weekly 29K', monthly: 'Monthly 79K',
      invite: '👯 Invite +2', redeem: '🔑 Redeem', upgrade: '💎 Premium', ok_btn: 'OK!', stat_total: 'Total', stat_done: 'Done', stat_free: 'Free', stat_maxlv: 'Max LV' },
    id: { badge: '🎯 Sniper Dandan', prep: 'Hitung mundur', prep_sub: 'Waktu dandan · Snipe 10 bos', quota: 'Sisa', target: 'target', vip: '💎 VIP',
      total: 'Total target', done: 'Selesai', free: 'Kuota gratis', maxlv: 'LV Tertinggi', tip: 'Like + komentar video',
      tip2: '30% kemungkinan masuk live lo!', section: 'Target Hari Ini', sort: 'Urut level',
      copy: 'Salin', locked: 'Terkunci', open_tiktok: 'Buka TikTok', mark: 'Tandai', done_btn: 'Selesai',
      unlock: 'Ajak teman', unlock_hint: 'Ajak 1 teman = buka 2 target', hidden: '🔒 Tersembunyi',
      share_title: 'Ajak teman', share_sub: 'Ajak 1 teman, berdua +2!', share_btn: 'Bagikan link',
      redeem_title: 'Pakai kode', redeem_sub: 'Berdua dapat +2 target!', upgrade_title: 'VIP Member',
      upgrade_sub: '50 target presisi per hari', weekly: 'Mingguan 29K', monthly: 'Bulanan 79K',
      invite: '👯 Ajak +2', redeem: '🔑 Pakai kode', upgrade: '💎 VIP', ok_btn: 'OK!', stat_total: 'Total', stat_done: 'Selesai', stat_free: 'Gratis', stat_maxlv: 'LV Max' }
  };

  // Tag translations
  const tagTrans = {
    zh: { '所有品类': '所有品类', '超级VIP': '超级VIP', '重量级': '重量级', '热舞': '热舞', '颜值': '颜值', '大方': '大方', 
      '搞笑': '搞笑', '脱口秀': '脱口秀', '夜生活': '夜生活', '竞技': '竞技', '游戏': '游戏', '车': '车',
      '音乐': '音乐', '乐器': '乐器', '文艺': '文艺', '美食': '美食', '旅行': '旅行', '生活': '生活',
      '唱歌': '唱歌', '弹唱': '弹唱', '民谣': '民谣', '挑战': '挑战', '互动': '互动', '讲故事': '讲故事', '情感': '情感', '电玩': '电玩' },
    en: { '所有品类': 'All', '超级VIP': 'VIP', '重量级': 'Heavy', '热舞': 'Dance', '颜值': 'Pretty', '大方': 'Generous', 
      '搞笑': 'Funny', '脱口秀': 'Talk show', '夜生活': 'Nightlife', '竞技': 'E-sports', '游戏': 'Games', '车': 'Cars',
      '音乐': 'Music', '乐器': 'Instruments', '文艺': 'Artsy', '美食': 'Food', '旅行': 'Travel', '生活': 'Lifestyle',
      '唱歌': 'Singing', '弹唱': 'Guitar', '民谣': 'Folk', '挑战': 'Challenge', '互动': 'Interactive', '讲故事': 'Story', '情感': 'Emotion', '电玩': 'Arcade' },
    id: { '所有品类': 'Semua', '超级VIP': 'VIP', '重量级': 'Berat', '热舞': 'Dansa', '颜值': 'Cantik', '大方': 'Dermawan',
      '搞笑': 'Lucu', '脱口秀': 'Talkshow', '夜生活': 'Malam', '竞技': 'E-sports', '游戏': 'Game', '车': 'Mobil',
      '音乐': 'Musik', '乐器': 'Alat musik', '文艺': 'Seni', '美食': 'Makanan', '旅行': 'Travel', '生活': 'Hidup',
      '唱歌': 'Nyanyi', '弹唱': 'Gitar', '民谣': 'Folk', '挑战': 'Tantangan', '互动': 'Interaktif', '讲故事': 'Cerita', '情感': 'Emosi', '电玩': 'Arkade' }
  };
  function tt(tag) { return tagTrans[lang]?.[tag] || tagTrans['en']?.[tag] || tag; }

  let lang = localStorage.getItem('wb_lang') || (navigator.language?.startsWith('zh')?'zh':navigator.language?.startsWith('id')?'id':'en');
  function t(k){return i18n[lang]?.[k]||i18n['en'][k]||k;}
  function setLang(l){lang=l;localStorage.setItem('wb_lang',l);
    document.querySelectorAll('.lang-btn').forEach(b=>{b.style.background=b.textContent.trim()===({zh:'中文',en:'EN',id:'ID'})[l]?'rgba(255,107,157,0.8)':'none';b.style.color=b.textContent.trim()===({zh:'中文',en:'EN',id:'ID'})[l]?'#fff':'rgba(255,255,255,0.6)'});
    applyLang();}
  function applyLang(){
    // Header
    document.querySelector('.header-badge').textContent = t('badge');
    document.querySelector('.prep-timer .label').textContent = '⏰ '+t('prep');
    document.querySelector('.prep-timer .sub').textContent = t('prep_sub');
    
    // Quota bar
    const q = window._quota || { freeQuota: 5, isPremium: false };
    document.querySelector('.quota-bar .left').innerHTML = '🎯 '+t('quota')+' <span class="num">'+q.freeQuota+'</span> '+t('target');
    document.querySelector('.btn-upgrade').textContent = q.isPremium ? '👑 VIP' : t('vip');
    
    // Stats - use correct IDs
    const totalStat = document.querySelector('#statTargets') || document.querySelector('.stat-item:first-child .num');
    if (totalStat && window._targets) totalStat.textContent = window._targets.length;
    document.querySelector('#statDone').textContent = completedTargets.size;
    document.querySelector('#statFree').textContent = q.freeQuota;
    if (window._targets) {
      const maxLv = Math.max(...window._targets.map(x=>x.level));
      document.querySelector('#statLevels').textContent = 'LV'+maxLv;
    }
    
    // Tips banner
    const tipEl = document.querySelector('.tip-banner .text');
    if (tipEl) tipEl.innerHTML = t('tip')+'<br>'+t('tip2');
    
    // Section header
    const sectionH2 = document.querySelector('.section-header h2');
    if (sectionH2) sectionH2.textContent = '🎯 '+t('section');
    const sectionCount = document.querySelector('.section-header .count');
    if (sectionCount) sectionCount.textContent = t('sort');
    
    // Stats labels
    document.querySelectorAll('.stat-item .lbl').forEach(el => {
      const txt = el.textContent.trim();
      if (txt === '目标总数') el.textContent = t('stat_total');
      else if (txt === 'Total' || txt === 'Total target') el.textContent = t('stat_total');
      else if (txt === '已完成' || txt === 'Done' || txt === 'Selesai') el.textContent = t('stat_done');
      else if (txt === '免费配额' || txt === 'Free quota' || txt === 'Kuota gratis') el.textContent = t('stat_free');
      else if (txt === '最高等级' || txt === 'Max LV' || txt === 'LV Tertinggi') el.textContent = t('stat_maxlv');
    });
    
    // Bottom buttons
    const bottomBtns = document.querySelectorAll('.share-btn, .price-btn');
    if (bottomBtns.length >= 3) {
      bottomBtns[0].innerHTML = t('invite');
      bottomBtns[1].innerHTML = t('redeem');
      bottomBtns[2].innerHTML = t('upgrade');
    }
    
    // Modals - Share
    const sm = document.getElementById('shareModal');
    if (sm) {
      sm.querySelector('h3').textContent = t('share_title');
      sm.querySelector('.sub').innerHTML = t('share_sub');
      sm.querySelector('.modal-btn.primary').textContent = t('share_btn');
    }
    
    // Modals - Redeem
    const rm = document.getElementById('redeemModal');
    if (rm) {
      rm.querySelector('h3').textContent = t('redeem_title');
      rm.querySelector('.sub').textContent = t('redeem_sub');
      rm.querySelector('.modal-btn.outline').textContent = t('redeem_alt');
    }
    
    // Modals - Upgrade
    const um = document.getElementById('upgradeModal');
    if (um) {
      um.querySelector('h3').textContent = t('upgrade_title');
      um.querySelector('.sub').textContent = t('upgrade_sub');
      const pay = document.getElementById('payBtn');
      if (pay) pay.textContent = selectedPlan === 'weekly' ? t('pay_weekly') : t('pay_monthly');
    }
    
    // Share sheet
    const ss = document.getElementById('shareSheet');
    if (ss) {
      ss.querySelector('h3').textContent = t('share_sheet_title');
      ss.querySelector('.sub').innerHTML = t('share_sheet_sub');
      ss.querySelector('.modal-btn.primary').textContent = t('ok_btn');
    }
    
    // Re-render targets (they use t() internally)
    if (window._targets) renderTargets(window._targets);
  }

    const API = window.location.origin + '/api';

    // ============================================================
    // Countdown Timer (30分钟 = 1800秒)
    // ============================================================
    let secondsLeft = 30 * 60;
    let completedTargets = new Set();

    function updateTimer() {
      if (secondsLeft <= 0) {
        document.getElementById('countdown').textContent = '🎬 开播！';
        return;
      }
      secondsLeft--;
      const m = Math.floor(secondsLeft / 60);
      const s = secondsLeft % 60;
      document.getElementById('countdown').textContent = 
        `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    setInterval(updateTimer, 1000);

    // ============================================================
    // Load Targets
    // ============================================================
    async function loadTargets() {
      try {
        const res = await fetch(`${API}/sniper/targets`);
        const data = await res.json();
        
        if (data.success && data.targets.length > 0) {
          renderTargets(data.targets);
          
          // Update stats
          document.getElementById('statTargets').textContent = data.targets.length;
          const maxLv = Math.max(...data.targets.map(t => t.level));
          document.getElementById('statLevels').textContent = `LV${maxLv}`;
        }
      } catch (err) {
        document.getElementById('targetList').innerHTML = `
          <div class="loading">
            <div style="font-size:32px;margin-bottom:8px;">😢</div>
            <p>暂未获取到大哥数据</p>
            <p style="font-size:12px;color:var(--text-darker);margin-top:8px;">请确认后端服务正常运行</p>
          </div>
        `;
      }
    }

    function renderTargets(targets) {
      const list = document.getElementById('targetList');
      list.innerHTML = '';

      targets.forEach((target, index) => {
        const isDone = completedTargets.has(target.id);
        const rankIcons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        const rankIcon = rankIcons[index] || `#${index+1}`;

        const card = document.createElement('div');
        card.className = `target-card ${target.isPremium ? 'premium' : ''}`;
        
        // Use emoji avatar instead of real image (avoids broken img)
        const avatarContent = target.isPremium ? '👑' : 
          target.level >= 45 ? '💎' :
          target.level >= 40 ? '🦁' :
          target.level >= 35 ? '🐯' : '⭐';

        card.innerHTML = `
          <div class="card-top">
            <div class="avatar">${avatarContent}</div>
            <div class="info">
              <div class="name">
                ${target.nickname || target.username}
                <span class="lv-badge">LV${target.level}</span>
              </div>
              <div class="username">@${target.username}</div>
              <div class="meta">
                ${target.tags.slice(0, 2).map(t => `<span class="tag">${tt(t)}</span>`).join('')}
                <span class="active">🟢 ${target.lastActive}</span>
              </div>
            </div>
            <div style="font-size:18px;opacity:0.4;">${rankIcon}</div>
          </div>
          <div class="comment-box">
            <button class="copy-btn" id="copyBtn${target.id}" onclick="copyComment(${target.id})">
              ${t("copy")}
            </button>
            <span class="quote">💬 "${target.comment}"</span>
          </div>
          <div class="actions">
            <a class="btn btn-primary" href="${target.videoUrl}" target="_blank" rel="noopener">
              🔗 ${t("open_tiktok")}
            </a>
            <button class="btn btn-outline" onclick="markDone(${target.id})">
              ${isDone ? t('done_btn') : t('mark')}
            </button>
          </div>
        `;

        list.appendChild(card);
      });
    }

    // ============================================================
    // Copy Comment
    // ============================================================
    function copyComment(id) {
      const target = window._targets.find(t => t.id === id);
      if (!target) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(target.comment).then(() => {
          showCopied(id);
        }).catch(() => {
          fallbackCopy(target.comment, id);
        });
      } else {
        fallbackCopy(target.comment, id);
      }
    }

    function fallbackCopy(text, id) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopied(id);
    }

    function showCopied(id) {
      const btn = document.getElementById(`copyBtn${id}`);
      if (!btn) return;
      btn.textContent = '✅ 已复制';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '📋 '+t('copy');
        btn.classList.remove('copied');
      }, 2000);
    }

    // ============================================================
    // Mark Done
    // ============================================================
    function markDone(id) {
      if (completedTargets.has(id)) {
        completedTargets.delete(id);
      } else {
        completedTargets.add(id);
      }
      document.getElementById('statDone').textContent = completedTargets.size;
      loadTargets(); // Re-render to update button states
    }

    // ============================================================
    // Share / Premium
    // ============================================================
    function shareForUnlock() {
      if (navigator.share) {
        navigator.share({
          title: 'WhaleBell — 化妆间狙击',
          text: '🔥 开播前狙击大哥！30分钟搞定今晚流水！',
          url: window.location.href
        }).catch(() => {});
      } else {
        // Fallback: copy invite link
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
        }
        showToast('✅ 链接已复制，发给你的姐妹吧！');
      }
    }

    function goPremium() {
      showToast('💎 会员功能开发中，敬请期待！');
    }

    // ============================================================
    // Toast
    // ============================================================
    function showToast(msg) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }

    // ============================================================
    // Referral / Quota functions
    // ============================================================
    let userId = 'user_' + Date.now(); // temp ID (will use auth later)
    let selectedPlan = 'weekly';

    function selectPlan(el, plan) {
      document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      selectedPlan = plan;
      document.getElementById('payBtn').textContent = 
        plan === 'weekly' ? '💳 支付 29K — 开通周卡' : '💳 支付 79K — 开通月卡';
    }

    async function loadQuota() {
      try {
        const res = await fetch(`${API}/dist/quota?userId=${userId}`);
        const data = await res.json();
        document.getElementById('quotaCount').textContent = data.freeQuota;
        document.getElementById('statFree').textContent = data.freeQuota;
        window._quota = data;
        
        // If premium, show upgrade button as active
        if (data.isPremium) {
          document.querySelector('.btn-upgrade').textContent = '👑 VIP 已激活';
          document.querySelector('.btn-upgrade').style.background = 'var(--success)';
        }
      } catch(e) {}
    }

    async function loadReferral() {
      try {
        const res = await fetch(`${API}/dist/referral/stats?userId=${userId}`);
        const data = await res.json();
        if (data.code) {
          document.getElementById('myInviteCode').textContent = data.code;
          document.getElementById('referralCount').textContent = data.totalReferrals;
          window._inviteCode = data.code;
        }
      } catch(e) {}
    }

    function showModal(type) {
      const map = { share: 'shareModal', redeem: 'redeemModal', upgrade: 'upgradeModal' };
      document.getElementById(map[type] || type).classList.add('show');
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove('show');
    }

    async function shareInvite() {
      // Generate invite code if not exists
      if (!window._inviteCode) {
        try {
          const res = await fetch(`${API}/dist/referral/generate`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId })
          });
          const data = await res.json();
          window._inviteCode = data.code;
          document.getElementById('myInviteCode').textContent = data.code;
          
          if (navigator.share) {
            await navigator.share({
              title: 'WhaleBell — 化妆间狙击',
              text: `🔥 Pakai kode "${data.code}" dapatkan 2 target大哥 gratis!`,
              url: data.shareUrl
            });
          } else {
            await navigator.clipboard.writeText(
              `🔥 Ajak 2 teman pakai kode "${data.code}", dapatkan akses VIP大哥 gratis!
${data.shareUrl}`
            );
          }
        } catch(e) {}
      } else {
        if (navigator.share) {
          await navigator.share({
            title: 'WhaleBell — 化妆间狙击',
            text: `🔥 Pakai kode "${window._inviteCode}" dapatkan 2 target大哥 gratis!`,
            url: window.location.href
          });
        } else {
          await navigator.clipboard.writeText(
            `🔥 Ajak 2 teman pakai kode "${window._inviteCode}", dapatkan akses VIP大哥 gratis!
${window.location.href}`
          );
        }
      }
      
      closeModal('shareModal');
      document.getElementById('shareSheet').classList.add('show');
      loadQuota();
      loadReferral();
    }

    async function redeemCode() {
      const code = document.getElementById('redeemInput').value.trim().toUpperCase();
      if (!code || code.length < 4) return;
      
      try {
        const res = await fetch(`${API}/dist/referral/redeem`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId, code })
        });
        const data = await res.json();
        if (data.success) {
          closeModal('redeemModal');
          showToast(`✅ 兑换成功！+2 大哥名额`);
          loadQuota();
        } else {
          showToast(`❌ ${data.error || '兑换失败'}`);
        }
      } catch(e) {
        showToast('❌ 网络错误');
      }
    }

    async function mockPay() {
      try {
        const res = await fetch(`${API}/dist/premium/mock`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId, plan: selectedPlan })
        });
        const data = await res.json();
        if (data.success) {
          closeModal('upgradeModal');
          showToast('🎉 ' + data.message);
          loadQuota();
          // Re-render to unlock all targets
          if (window._targets) renderTargets(window._targets);
          document.getElementById('statFree').textContent = '∞';
        }
      } catch(e) {
        showToast('❌ 网络错误');
      }
    }

    // ============================================================
    // Override renderTargets to support locking
    // ============================================================
    const _origRenderTargets = renderTargets;
    renderTargets = function(targets) {
      const list = document.getElementById('targetList');
      list.innerHTML = '';
      
      const quota = window._quota || { freeQuota: 5, isPremium: false };
      const isPremium = quota.isPremium;

      targets.forEach((target, index) => {
        const isDone = completedTargets.has(target.id);
        const isLocked = !isPremium && index >= quota.freeQuota;
        const rankIcons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        const rankIcon = rankIcons[index] || `#${index+1}`;
        const avatarContent = target.isPremium ? '👑' : 
          target.level >= 45 ? '💎' :
          target.level >= 40 ? '🦁' :
          target.level >= 35 ? '🐯' : '⭐';

        const card = document.createElement('div');
        card.className = `target-card ${target.isPremium ? 'premium' : ''} ${isLocked ? 'locked' : ''}`;

        card.innerHTML = isLocked ? `
          <div class="card-top">
            <div class="avatar">🔒</div>
            <div class="info">
              <div class="name">${t("hidden")}</div>
              <div class="username"></div>
              <div class="meta"><span class="tag">${t("unlock")}</span></div>
            </div>
          </div>
          <div class="comment-box" style="opacity:0.3;filter:blur(4px);pointer-events:none;">
            <button class="copy-btn" style="background:var(--text-darker);cursor:not-allowed;opacity:0.5;">📋 ••••</button>
            <span class="quote">💬 "•••••••••••••••••••••••••"</span>
          </div>
          <div class="actions">
            <a class="btn btn-primary" style="background:var(--text-darker);pointer-events:none;opacity:0.4;">🔒 ${t("locked")}</a>
            <button class="btn btn-outline" onclick="showModal('share')">👯 ${t("unlock")}</button>
          </div>
          <div class="lock-overlay" onclick="showModal('share')">
            <div class="lock-icon">🔒</div>
            <div class="lock-text">${t("unlock")}</div>
            <div class="lock-sub">${t("unlock_hint")}</div>
          </div>
        ` : `
          <div class="card-top">
            <div class="avatar">${avatarContent}</div>
            <div class="info">
              <div class="name">
                ${target.nickname || target.username}
                <span class="lv-badge">LV${target.level}</span>
              </div>
              <div class="username">@${target.username}</div>
              <div class="meta">
                ${target.tags.slice(0, 2).map(t => '<span class="tag">'+tt(t)+'</span>').join('')}
                <span class="active">🟢 ${target.lastActive}</span>
              </div>
            </div>
            <div style="font-size:18px;opacity:0.4;">${rankIcon}</div>
          </div>
          <div class="comment-box">
            <button class="copy-btn" id="copyBtn${target.id}" onclick="copyComment(${target.id})">📋 ${t("copy")}</button>
            <span class="quote">💬 "${target.comment}"</span>
          </div>
          <div class="actions">
            <a class="btn btn-primary" href="${target.videoUrl}" target="_blank" rel="noopener">🔗 ${t("open_tiktok")}</a>
            <button class="btn btn-outline" onclick="${isDone ? 'markDone('+target.id+')' : 'markDone('+target.id+')'}">${isDone ? t('done_btn') : '☑️ '+t('mark')}</button>
          </div>
        `;

        list.appendChild(card);
      });
    };

    // ============================================================
    // Init - store targets globally for copy function
    // ============================================================
    (async function init() {
      try {
        // Load quota first
        await loadQuota();
        await loadReferral();

        // Load targets
        const res = await fetch(`${API}/sniper/targets`);
        const data = await res.json();
        if (data.success) {
          window._targets = data.targets;
          renderTargets(data.targets);
          const maxLv = Math.max(...data.targets.map(t => t.level));
          document.getElementById('statTargets').textContent = data.targets.length;
          document.getElementById('statLevels').textContent = `LV${maxLv}`;
        }
        applyLang();
      } catch (err) {
        document.getElementById('targetList').innerHTML = `
          <div class="loading">
            <div style="font-size:32px;margin-bottom:8px;">😢</div>
            <p>暂未获取到大哥数据</p>
          </div>
        `;
      }
    })();
  