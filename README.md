# BoostMass – Deployment Guide

## Project Structure
```
boostmass/
├── server.js          ← Express backend (Railway)
├── package.json       ← Node dependencies
├── railway.toml       ← Railway config
└── public/
    └── index.html     ← The BoostMass HTML (rename boostmass.html → index.html)
```

## Setup Steps

### 1. Prepare Files
- Rename `boostmass.html` → `index.html`
- Place it inside a folder called `public/`

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app) and create a new project
2. Connect your GitHub repo (or drag & drop this folder)
3. Railway will auto-detect Node.js and run `npm start`

### 3. Set Environment Variables on Railway
In your Railway project → **Variables** tab, add:

| Variable | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Your bot token from @BotFather |
| `DEFAULT_ADMIN_ID` | `6940101627` (or leave blank, it's already hardcoded) |

### 4. How the Admin Telegram ID Works

**Default admin:** `6940101627` — receives ALL submissions unless overridden.

**Override via URL:**
```
https://yoursite.railway.app/?admin=TELEGRAM_USER_ID
```
Example:
```
https://yoursite.railway.app/?admin=123456789
```
That person will receive the form submission on Telegram instead.

**Share different links to different admins:**
```
https://yoursite.railway.app/?admin=111111111  ← Admin A
https://yoursite.railway.app/?admin=222222222  ← Admin B
```

### 5. Telegram Message Format
Each submission sends a message like:
```
🚀 NEW BOOSTMASS SUBMISSION
━━━━━━━━━━━━━━━━━━━━━━

📱 Platform: tiktok
🎯 Boost Type: followers

👤 ACCOUNT DETAILS
• Full Name:   John Doe
• Email:       john@example.com
• Username:    @johndoe
• Profile URL: https://tiktok.com/@johndoe
• Country:     US
• Acct Type:   creator

📊 BOOST CONFIG
• Amount:   10,000
• Speed:    🚀 Fast (1–6 hours)

📝 Notes: None

✅ Agreed to Terms: Yes
🔔 Email Updates: Yes

🕐 Submitted: Fri, 27 Feb 2026 12:00:00 GMT
━━━━━━━━━━━━━━━━━━━━━━
```

### 6. Create your Telegram Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the token and paste it into Railway as `TELEGRAM_BOT_TOKEN`
4. Start a chat with your new bot (send it `/start`) so it can message you

## Form Field Names Reference
| Field | name= attribute |
|---|---|
| Platform | `selected_platform` |
| Boost Type | `boost_type` |
| Full Name | `full_name` |
| Email | `email` |
| Username | `username` |
| Profile URL | `profile_url` |
| Country | `country` |
| Boost Amount | `boost_amount` |
| Delivery Speed | `delivery_speed` |
| Account Type | `account_type` |
| Notes | `notes` |
| Terms Agreement | `agree_terms` |
| Email Updates | `agree_notify` |
| Admin Telegram ID | `admin_id` (hidden, auto-set) |
