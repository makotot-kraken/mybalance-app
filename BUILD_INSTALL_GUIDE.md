# 📱 MyBalance - Build & Install on iPhone

## ✅ Icon Setup Complete!
Your beautiful geometric icon has been configured in:
- `assets/icon.png` - Main app icon (1024x1024)
- `app.json` - Updated with dark theme and proper branding

---

## 🚀 Option 1: Build with EAS (Recommended for Production)

This creates a **real standalone app** you can install permanently on your iPhone.

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```
- If you don't have an Expo account, create one at https://expo.dev
- It's **100% FREE** for personal projects

### Step 3: Configure Your Project
```bash
eas build:configure
```
- This will ask you to confirm the project ID
- Press **Y** to accept

### Step 4: Build for iOS (Ad Hoc - No App Store needed)
```bash
eas build --platform ios --profile preview
```

**What happens:**
1. EAS uploads your code to Expo's cloud
2. Builds the app on their servers (15-30 minutes)
3. Gives you a download link for the `.ipa` file

### Step 5: Install on Your iPhone

**Method A - Direct Install via EAS:**
1. Open the build link on your iPhone (sent via email/terminal)
2. Tap "Install"
3. Go to Settings > General > VPN & Device Management
4. Trust the developer certificate
5. App appears on home screen!

**Method B - Via AltStore (No Apple Developer Account needed):**
1. Install AltStore on Mac: https://altstore.io
2. Install AltStore app on iPhone via WiFi
3. Download the `.ipa` file from EAS
4. Drag `.ipa` into AltStore
5. Done!

---

## 🔧 Option 2: Development Build (Faster, for Testing)

If you want to keep testing with live updates:

### Build Development Client:
```bash
eas build --platform ios --profile development
```

This creates an app that can:
- ✅ Load from your local Expo server
- ✅ Hot reload when you change code
- ✅ Run as standalone app (no Expo Go needed)

---

## ⚡ Option 3: TestFlight (Official Apple Distribution)

If you want to distribute to others or use official Apple channels:

### Requirements:
- Apple Developer Account ($99/year)
- App Store Connect access

### Steps:
```bash
# 1. Build for App Store
eas build --platform ios --profile production

# 2. Submit to TestFlight
eas submit --platform ios
```

Then invite testers via App Store Connect (up to 10,000 users).

---

## 🖥️ About Your Backend (API Server)

### Current Setup:
- ✅ API Server (port 3001) - Scrapes Metaplanet prices
- ⚠️ Runs on your Mac - **not accessible when Mac is off**

### For Standalone App, You Need To:

**Option A: Deploy API to Cloud (Recommended)**

1. **Render.com (Free tier):**
```bash
# In your terminal
cd /Users/makoto.tamura/Projects/MyBalance

# Create a new file for cloud deployment
cat > render.yaml << 'EOF'
services:
  - type: web
    name: mybalance-api
    env: node
    buildCommand: npm install
    startCommand: node api-server.js
    envVars:
      - key: PORT
        value: 3001
EOF
```

Then:
- Push to GitHub
- Connect Render.com to your repo
- Auto-deploys! Get a URL like: `https://mybalance-api.onrender.com`

2. **Update app to use cloud API:**
In `data/assets.js`, change:
```javascript
// From:
const response = await fetch('http://localhost:3001/api/metaplanet-price');

// To:
const response = await fetch('https://your-app.onrender.com/api/metaplanet-price');
```

**Option B: Keep Using Mac as Server**
- Only works when your Mac is on and on WiFi
- Not recommended for standalone app

---

## 📋 Pre-Build Checklist

Before building, make sure:

- [ ] Icon is in `assets/icon.png` ✅ (Already done!)
- [ ] `app.json` configured ✅ (Already done!)
- [ ] Both servers running (if testing locally)
- [ ] No errors in the app
- [ ] Expo account created (free at expo.dev)

---

## 🎯 Recommended Path for You

**For Quick Install Today:**
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Build preview version
eas build --platform ios --profile preview

# 4. Wait 20-30 minutes, then install from link sent to you
```

**Next Steps (After Testing):**
1. Deploy API server to Render.com (free)
2. Update API URL in code
3. Build production version
4. Install permanently on phone

---

## 💡 Quick Commands Reference

```bash
# Build for testing (ad-hoc distribution)
eas build --platform ios --profile preview

# Build development version (connects to your Mac)
eas build --platform ios --profile development

# Build production version (for App Store/TestFlight)
eas build --platform ios --profile production

# Check build status
eas build:list

# View build details
eas build:view [build-id]
```

---

## 🆘 Troubleshooting

**"Command not found: eas"**
```bash
npm install -g eas-cli
```

**"Not logged in"**
```bash
eas login
```

**"Build failed"**
- Check for errors in the build logs
- Make sure `package.json` has all dependencies
- Verify `app.json` is valid JSON

**"Can't install on iPhone"**
- Go to Settings > General > VPN & Device Management
- Trust the developer certificate
- Or use AltStore for easier installation

---

## 🎉 Next Steps

Ready to build? Run:
```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile preview
```

Want me to help you through the process step by step?
