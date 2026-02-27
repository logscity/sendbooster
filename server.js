// BoostMass – Telegram Bot Notifier
// Deploy on Railway. Set TELEGRAM_BOT_TOKEN in Railway environment variables.
// Optional: set DEFAULT_ADMIN_ID (falls back to 6940101627 if not set)

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Env ──────────────────────────────────────────────────────────────────────
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEFAULT_ADMIN = process.env.DEFAULT_ADMIN_ID || "6940101627";

if (!BOT_TOKEN) {
  console.error("❌  TELEGRAM_BOT_TOKEN is not set in environment variables!");
  process.exit(1);
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors()); // handle preflight for all routes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve the HTML file from the same folder (place boostmass.html next to server.js)
app.use(express.static(path.join(__dirname, "public")));

// ── Telegram Helper ───────────────────────────────────────────────────────────
async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return data;
}

// ── Format message from form fields ──────────────────────────────────────────
// Known fields are grouped into neat sections.
// Any NEW field you add to the HTML form is auto-caught at the bottom
// under "Extra Details" — no server changes needed, ever.

const KNOWN_FIELDS = new Set([
  "selected_platform", "boost_type",
  "full_name", "email", "username", "profile_url", "country",
  "boost_amount", "boost_amount_range", "delivery_speed", "account_type", "notes",
  "agree_terms", "agree_notify", "admin_id",
]);

const SKIP_FIELDS = new Set(["admin_id", "boost_amount_range"]);

const SPEED_MAP = {
  instant: "⚡ Instant (1–3 mins)",
  fast:    "🚀 Fast (1–6 hours)",
  gradual: "📈 Gradual (1–3 days)",
};

function formatFieldName(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function val(v, fallback = "—") {
  return v && v.toString().trim() ? v.toString().trim() : fallback;
}

function buildMessage(body) {
  const now = new Date().toUTCString();

  const lines = [
    `🚀 <b>NEW BOOSTMASS SUBMISSION</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📱 <b>Platform:</b> ${val(body.selected_platform)}`,
    `🎯 <b>Boost Type:</b> ${val(body.boost_type)}`,
    ``,
    `👤 <b>ACCOUNT DETAILS</b>`,
    `• <b>Full Name:</b> ${val(body.full_name)}`,
    `• <b>Email:</b> ${val(body.email)}`,
    `• <b>Username:</b> ${val(body.username)}`,
    `• <b>Profile URL:</b> ${val(body.profile_url, "Not provided")}`,
    `• <b>Country:</b> ${val(body.country)}`,
    `• <b>Account Type:</b> ${val(body.account_type)}`,
    ``,
    `📊 <b>BOOST CONFIG</b>`,
    `• <b>Amount:</b> ${body.boost_amount ? Number(body.boost_amount).toLocaleString() : "—"}`,
    `• <b>Speed:</b> ${SPEED_MAP[body.delivery_speed] || val(body.delivery_speed)}`,
    ``,
    `📝 <b>Notes:</b> ${val(body.notes, "None")}`,
    ``,
    `✅ <b>Agreed to Terms:</b> ${body.agree_terms === "yes" ? "Yes" : "No"}`,
    `🔔 <b>Email Updates:</b> ${body.agree_notify === "yes" ? "Yes" : "No"}`,
  ];

  // ── Auto-catch any extra fields not in the known list ──
  const extraEntries = Object.entries(body).filter(
    ([key]) => !KNOWN_FIELDS.has(key) && !SKIP_FIELDS.has(key)
  );

  if (extraEntries.length > 0) {
    lines.push(``);
    lines.push(`➕ <b>EXTRA DETAILS</b>`);
    for (const [key, value] of extraEntries) {
      lines.push(`• <b>${formatFieldName(key)}:</b> ${val(value)}`);
    }
  }

  lines.push(``);
  lines.push(`🕐 <b>Submitted:</b> ${now}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);

  return lines.join("\n");
}

// ── POST /submit ──────────────────────────────────────────────────────────────
// The HTML form posts here. The ?admin= query param (or header) sets recipient.
app.post("/submit", async (req, res) => {
  try {
    // Determine the Telegram recipient
    // Priority: ?admin= query param → req.body.admin_id → DEFAULT_ADMIN
    const recipientId =
      req.query.admin ||
      req.body.admin_id ||
      DEFAULT_ADMIN;

    const message = buildMessage(req.body);

    await sendTelegramMessage(recipientId, message);

    console.log(`✅  Submission forwarded to Telegram ID: ${recipientId}`);

    res.json({ success: true, message: 'Boost submitted successfully!' });
  } catch (err) {
    console.error("❌  Error sending to Telegram:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Root → serve HTML ─────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  BoostMass server running on port ${PORT}`);
  console.log(`   Default admin Telegram ID: ${DEFAULT_ADMIN}`);
});
