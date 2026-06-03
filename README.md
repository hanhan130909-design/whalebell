# 🐋 WhaleBell

**TikTok 主播实时高等级观众提醒系统**

当高等级观众（大哥/鲸鱼）进入直播间时，WhaleBell 会实时提醒主播，让主播不错过任何一位重要观众。

## 功能特性

- 🔔 **实时进场提醒** — 高等级观众进入直播间时弹窗+声音提醒
- 🏆 **金主排行榜** — 送礼最多、等级最高的观众排名
- 📊 **直播数据复盘** — 每场直播的观众质量报告
- 📱 **手机端适配** — 直播时手机瞥一眼就能用
- 🌐 **多语言** — 中文/English/Indonesia

## 快速开始

```bash
# 安装依赖
cd backend && npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 Supabase 密钥

# 启动
npm run dev
```

## 技术栈

- **后端**: Node.js + Express + WebSocket
- **数据库**: Supabase (PostgreSQL)
- **前端**: 纯 HTML/CSS/JS (移动端适配)
- **实时通信**: WebSocket
