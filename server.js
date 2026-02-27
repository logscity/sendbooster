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
// Fully dynamic — reads every field by its name= attribute automatically.
// Add any new input to your HTML form and it will appear in the Telegram message.

// Fields to skip from the Telegram message (internal/hidden control fields)
const SKIP_FIELDS = new Set(["admin_id"]);

// Make a field name human-readable: "full_name" → "Full Name"
function formatFieldName(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildMessage(body) {
  const now = new Date().toUTCString();

  const lines = [
    `🚀 <b>NEW BOOSTMASS SUBMISSION</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
  ];

  for (const [key, value] of Object.entries(body)) {
    // Skip internal fields
    if (SKIP_FIELDS.has(key)) continue;

    const label = formatFieldName(key);
    const val = value && value.toString().trim() ? value : "—";
    lines.push(`• <b>${label}:</b> ${val}`);
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
