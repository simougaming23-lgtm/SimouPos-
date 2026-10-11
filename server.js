const express = require("express");
const Database = require("better-sqlite3");

const PIN = process.env.POS_PIN || "1234";      // غيّره قبل النشر!
const PORT = process.env.PORT || 3000;
const db = new Database(process.env.DB_FILE || "data.db");
db.exec("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL, t INTEGER)");

const fs = require("fs");
const VERSION = process.env.RENDER_GIT_COMMIT || require("./package.json").version;
const app = express();
app.get("/sw.js", (req, res) => {          // يتغير رقم النسخة => الهواتف تعرض زر "تحديث الآن"
  res.set({ "Content-Type": "application/javascript", "Cache-Control": "no-cache" });
  res.send(fs.readFileSync(__dirname + "/sw.template.js", "utf8").replace("__VERSION__", VERSION));
});
app.use(express.json({ limit: "5mb" }));
app.use(express.static("public", { setHeaders: (res, p) => { if (/\.(html|webmanifest)$/.test(p)) res.set("Cache-Control", "no-cache"); } }));

const CASHIER_PIN = process.env.CASHIER_PIN || "0000";   // رمز الكاشير: غيّره أيضاً
const fails = new Map();                                  // حماية بسيطة من تخمين الرمز
app.post("/api/login", (req, res) => {
  const ip = req.ip, now = Date.now();
  const f = (fails.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  if (f.length >= 10) return res.status(429).json({ error: "محاولات كثيرة، انتظر 10 دقائق" });
  const p = String((req.body || {}).pin || "");
  const role = p === PIN ? "m" : p === CASHIER_PIN ? "c" : null;
  if (!role) { f.push(now); fails.set(ip, f); return res.status(401).json({ error: "رمز خاطئ" }); }
  res.json({ role });
});

app.use("/api", (req, res, next) =>
  [PIN, CASHIER_PIN].includes(req.get("x-pin")) ? next() : res.status(401).json({ error: "رمز خاطئ" }));

app.get("/api/state", (req, res) => {
  const row = db.prepare("SELECT v FROM kv WHERE k='state'").get();
  res.json(row ? JSON.parse(row.v) : {});
});

app.post("/api/state", (req, res) => {
  const { P, INV, PUR = [], EXP = [] } = req.body || {};
  if (!Array.isArray(P) || !Array.isArray(INV))
    return res.status(400).json({ error: "بيانات غير صالحة" });
  const now = Date.now();
  db.prepare("INSERT INTO kv(k,v,t) VALUES('state',?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,t=excluded.t")
    .run(JSON.stringify({ P, INV, PUR, EXP }), now);
  // نسخة احتياطية يومية داخل نفس القاعدة
  const day = new Date(now).toISOString().slice(0, 10);
  db.prepare("INSERT OR REPLACE INTO kv(k,v,t) VALUES(?,?,?)").run("backup-" + day, JSON.stringify({ P, INV, PUR, EXP }), now);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log("POS على المنفذ " + PORT));
