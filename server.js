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
function buildMessage(body) {
  const {
    selected_platform,
    boost_type,
    full_name,
    email,
    username,
    profile_url,
    country,
    boost_amount,
    delivery_speed,
    account_type,
    notes,
    agree_terms,
    agree_notify,
  } = body;

  const now = new Date().toUTCString();

  const speedMap = {
    instant: "⚡ Instant (1–3 mins)",
    fast: "🚀 Fast (1–6 hours)",
    gradual: "📈 Gradual (1–3 days)",
  };

  const lines = [
    `🚀 <b>NEW BOOSTMASS SUBMISSION</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📱 <b>Platform:</b> ${selected_platform || "N/A"}`,
    `🎯 <b>Boost Type:</b> ${boost_type || "N/A"}`,
    ``,
    `👤 <b>ACCOUNT DETAILS</b>`,
    `• Full Name:   ${full_name || "N/A"}`,
    `• Email:       ${email || "N/A"}`,
    `• Username:    ${username || "N/A"}`,
    `• Profile URL: ${profile_url || "Not provided"}`,
    `• Country:     ${country || "N/A"}`,
    `• Acct Type:   ${account_type || "N/A"}`,
    ``,
    `📊 <b>BOOST CONFIG</b>`,
    `• Amount:   ${Number(boost_amount).toLocaleString() || "N/A"}`,
    `• Speed:    ${speedMap[delivery_speed] || delivery_speed || "N/A"}`,
    ``,
    `📝 <b>Notes:</b> ${notes || "None"}`,
    ``,
    `✅ Agreed to Terms: ${agree_terms === "yes" ? "Yes" : "No"}`,
    `🔔 Email Updates: ${agree_notify === "yes" ? "Yes" : "No"}`,
    ``,
    `🕐 <b>Submitted:</b> ${now}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
  ];

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
