# 🌐 Deploy Metaplanet API to Cloud (Free)

Your app needs the Metaplanet price API to work. Right now it runs on your Mac.
Let's deploy it to the cloud for FREE so your app works anywhere!

---

## 🚀 Option 1: Render.com (Recommended - Easiest)

### Step 1: Prepare for Deployment

Create a `render.yaml` file:
```bash
cd /Users/makoto.tamura/Projects/MyBalance

cat > render.yaml << 'EOF'
services:
  - type: web
    name: mybalance-api
    env: node
    region: oregon
    plan: free
    buildCommand: npm install
    startCommand: node api-server.js
    envVars:
      - key: PORT
        fromGroup: web
EOF
```

### Step 2: Push to GitHub
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "MyBalance app ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/mybalance.git
git push -u origin main
```

### Step 3: Deploy on Render
1. Go to https://render.com
2. Sign up (free)
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Select "mybalance" repo
6. Click "Create Web Service"
7. Wait 2-3 minutes for deployment

### Step 4: Get Your API URL
You'll get a URL like: `https://mybalance-api.onrender.com`

### Step 5: Update Your App
In `/Users/makoto.tamura/Projects/MyBalance/data/assets.js`:

Find this line (around line 125):
```javascript
const response = await fetch('http://localhost:3001/api/metaplanet-price');
```

Replace with:
```javascript
const response = await fetch('https://your-app-name.onrender.com/api/metaplanet-price');
```

---

## 🔧 Option 2: Railway.app (Also Free)

### Steps:
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway auto-detects Node.js
6. Click "Deploy"
7. Get your URL from settings

Same process - update the API URL in `data/assets.js`

---

## ⚡ Option 3: Vercel (Serverless)

For Vercel, you need to convert to serverless functions:

Create `api/metaplanet-price.js`:
```javascript
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = async (req, res) => {
  try {
    const { stdout } = await execPromise('python3 scripts/metaplanet_scraper.py');
    const data = JSON.parse(stdout);
    
    res.setHeader('Cache-Control', 's-maxage=300');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price' });
  }
};
```

Deploy:
```bash
npm i -g vercel
vercel
```

---

## ✅ After Deployment Checklist

1. [ ] API deployed to cloud
2. [ ] Test API URL in browser (should return JSON)
3. [ ] Updated API URL in `data/assets.js`
4. [ ] Committed changes to git
5. [ ] Ready to build app!

---

## 🧪 Test Your Deployed API

```bash
# Replace with your actual URL
curl https://your-app.onrender.com/api/metaplanet-price
```

Should return:
```json
{
  "price": 487,
  "currency": "JPY",
  "symbol": "3350.T",
  "source": "scraped"
}
```

---

## 💰 Free Tier Limits

**Render.com:**
- ✅ 750 hours/month free
- ✅ Sleeps after 15 min inactivity (wakes in ~30 sec)
- ✅ Perfect for personal projects

**Railway.app:**
- ✅ $5 free credit/month
- ✅ No sleep time
- ✅ Faster performance

**Vercel:**
- ✅ Unlimited serverless invocations
- ✅ 100GB bandwidth
- ✅ Instant cold starts

---

## 🎯 Recommended: Render.com

**Why?**
- Easiest setup
- Good free tier
- Auto-deploys from GitHub
- Works great for this use case

**Time needed:** 10 minutes

Ready to deploy? Let me know which option you prefer!
