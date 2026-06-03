"""WhaleBell Data Sync"""
import sqlite3, json, os, urllib.request

SQLITE = 'C:/Users/user/TikTokSystem/data/tiktok_data.db'
ENV = 'D:/whaleBell/backend/.env'

SUPABASE_URL = ""
SUPABASE_KEY = ""
if os.path.exists(ENV):
    for line in open(ENV, encoding="utf-8"):
        if line.startswith("SUPABASE_URL="): SUPABASE_URL = line.split("=",1)[1].strip()
        elif line.startswith("SUPABASE_SERVICE_KEY="): SUPABASE_KEY = line.split("=",1)[1].strip()
        elif not SUPABASE_KEY and line.startswith("SUPABASE_ANON_KEY="): SUPABASE_KEY = line.split("=",1)[1].strip()

conn = sqlite3.connect(SQLITE)
conn.row_factory = sqlite3.Row
sql = """SELECT displayId, MAX(nickname) as nickname, MAX(level) as level, SUM(hostcoins) as total_coins, COUNT(DISTINCT hostDisplayId) as rooms, MAX(region) as region FROM brother_info WHERE level>=10 GROUP BY displayId ORDER BY level DESC LIMIT 500"""
users = [dict(r) for r in conn.execute(sql)]
conn.close()
print(f"SQLite: {len(users)} whales")

for u in users:
    t = ["high_level"]
    if u["total_coins"] > 50000: t.append("often_gifter")
    if u["level"] >= 30: t.append("gamer")
    if u["rooms"] >= 5: t.append("night_owl")
    u["tags"] = t; u["persona"] = t[1] if len(t) > 1 else "often_gifter"

def post(table, data):
    h = {"apikey": SUPABASE_KEY, "Authorization": "Bearer "+SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=minimal"}
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{table}", data=json.dumps(data).encode(), headers=h, method="POST")
    try: urllib.request.urlopen(req, timeout=30); return True
    except urllib.error.HTTPError as e: return e.code, e.read()

ok = 0
for i in range(0, len(users), 50):
    batch = [{"username": u["displayId"], "nickname": u["nickname"] or u["displayId"], "level": u["level"], "tags": u["tags"], "persona": u["persona"], "total_coins": u["total_coins"], "region": u["region"], "rooms_visited": u["rooms"]} for u in users[i:i+50]]
    r = post("whale_profiles", batch)
    if r is True: ok += len(batch); print(f"  {ok}/{len(users)}")
    else: print(f"  HTTP {r[0]}"); break
print(f"Done: {ok} whales")