# 🚀 Why Your Backend Doesn't Work on Vercel (And How to Fix It)

## 📊 **Current Architecture**

Your project has a **monorepo structure**:
```
SHADOW-FUND/
├── backend/           ← Next.js backend API
│   ├── pages/api/    ← API routes
│   ├── lib/          ← Business logic
│   └── package.json
├── frontend files/   ← Vite React frontend (root level)
│   ├── index.tsx
│   ├── Dashboard.tsx
│   └── package.json
└── vercel.json       ← Deployment config
```

## ❌ **Why Vercel Deployment Is Failing**

### Problem 1: **Monorepo Not Configured Properly**
Vercel sees TWO projects in one repo:
1. Root-level Vite frontend
2. `/backend` Next.js API

**Result**: Vercel deploys the frontend but can't find the backend API routes.

### Problem 2: **Build Configuration**
Your `vercel.json` tries to rewrite `/api/*` to `/backend/pages/api/*`, but:
- Vercel doesn't build the backend separately
- The backend dependencies aren't installed in production
- Environment variables aren't set for the backend

### Problem 3: **Missing Environment Variables**
Your backend needs:
- `SOLANA_RPC_URL`
- `GEMINI_API_KEY`
- `SHADOWWIRE_CLUSTER`
- `SERVER_WALLET_SECRET`

These are in `backend/.env.local` locally, but **not in Vercel**.

---

## ✅ **Solutions** (Pick One)

### 🎯 **Option 1: Deploy Backend Separately** (Recommended)

Deploy frontend and backend as **separate Vercel projects**.

#### **1a. Deploy Backend to Vercel**

**Step 1**: Create a new Vercel project for backend
```bash
cd backend
vercel  # This will create a NEW project
```

**Step 2**: Set environment variables in Vercel dashboard:
- Go to https://vercel.com/your-username/shadowfund-backend/settings/environment-variables
- Add:
  - `SOLANA_RPC_URL` = `https://api.mainnet-beta.solana.com`
  - `GEMINI_API_KEY` = your_api_key
  - `SHADOWWIRE_CLUSTER` = `mainnet-beta`
  - `TESTING_MODE` = `true`
  - `SERVER_WALLET_SECRET` = your_secret

**Step 3**: Update frontend to point to backend URL
```bash
# In root .env.local
VITE_API_URL=https://your-backend.vercel.app
```

**Step 4**: Redeploy frontend
```bash
vercel --prod
```

---

### 🎯 **Option 2: Fix Monorepo Deployment**

Keep both in one repo but configure Vercel properly.

**Step 1**: Update `vercel.json` in root:
```json
{
  "version": 2,
  "buildCommand": "cd backend && npm install && npm run build",
  "installCommand": "npm install && cd backend && npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/backend/pages/api/:path*"
    }
  ]
}
```

**Step 2**: Add `vercel.json` in `/backend`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "pages/**/*.ts",
      "use": "@vercel/node"
    }
  ]
}
```

**Step 3**: Set environment variables in Vercel dashboard for the project.

**Step 4**: Redeploy.

---

### 🎯 **Option 3: Use Local Backend for Now** (Quickest)

**Keep backend running locally** and deploy only frontend to Vercel.

**Limitation**: Backend won't be publicly accessible, but frontend will work on Vercel when you're running backend locally.

**Not Recommended**: Only good for demo/testing.

---

## 🔥 **My Recommendation: Option 1 (Separate Deployments)**

### Why?
- ✅ **Cleaner separation** of concerns
- ✅ **Independent scaling** (frontend & backend scale separately)
- ✅ **Easier debugging** (separate logs & deployments)
- ✅ **Better security** (backend env vars isolated)
- ✅ **Faster builds** (don't rebuild both every time)

### How to Do It (Step by Step)

#### **Part A: Deploy Backend**

```bash
# 1. Navigate to backend
cd backend

# 2. Initialize new Vercel project
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - What's your project's name? shadowfund-backend
# - In which directory is your code? ./
# - Want to override settings? No

# 3. Add environment variables via Vercel dashboard (see list above)

# 4. Deploy to production
vercel --prod
```

**Your backend will be at**: `https://shadowfund-backend.vercel.app`

#### **Part B: Update Frontend Config**

```bash
# 1. Go back to root
cd ..

# 2. Update .env.local
echo "VITE_API_URL=https://shadowfund-backend.vercel.app" > .env.local

# 3. Rebuild frontend (if needed)
npm run build

# 4. Deploy to Vercel
vercel --prod
```

**Your frontend will be at**: `https://shadow-fund-oxo2.vercel.app`

---

## 🛠️ **Quick Fix: For Testing Now**

Want to test your **local backend** with **deployed frontend**?

**Problem**: CORS - Vercel frontend can't call localhost backend.

**Solution**: Use ngrok to expose local backend:

```bash
# 1. Install ngrok (if not installed)
brew install ngrok

# 2. Expose local backend
ngrok http 3001

# You'll get a URL like: https://abc123.ngrok.io

# 3. Update Vercel environment variable
# Go to Vercel dashboard → shadow-fund-oxo2 → Settings → Environment Variables
# Update VITE_API_URL to your ngrok URL

# 4. Redeploy frontend on Vercel
```

**Now Vercel frontend → ngrok → local backend!**

---

## 📋 **Deployment Checklist**

### Backend Deployment
- [ ] Create separate Vercel project for backend
- [ ] Set all environment variables in Vercel
- [ ] Test backend endpoints (health check)
- [ ] Verify API routes return 200

### Frontend Deployment
- [ ] Update `VITE_API_URL` to backend URL
- [ ] Rebuild frontend with new env var
- [ ] Deploy to Vercel
- [ ] Test wallet connection
- [ ] Verify API calls work

---

## 🔍 **Testing Deployed Backend**

Once backend is deployed:

```bash
# Test health endpoint
curl https://shadowfund-backend.vercel.app/api/health

# Test treasury endpoint
curl "https://shadowfund-backend.vercel.app/api/treasury?wallet=YOUR_WALLET&risk=medium"

# Test debug endpoint
curl "https://shadowfund-backend.vercel.app/api/debug-balance?wallet=YOUR_WALLET"
```

All should return JSON (not 404).

---

## 💡 **Why Local Works But Vercel Doesn't**

| Aspect | Local | Vercel (Current) |
|--------|-------|------------------|
| Backend Running | ✅ `npm run dev` | ❌ Not deployed |
| API Routes | ✅ Next.js serves them | ❌ Routes not found |
| Env Variables | ✅ `.env.local` | ❌ Not configured |
| Dependencies | ✅ Installed | ❌ Not installed for backend |

---

## 🎯 **Next Steps**

**Choose your path**:

1. **Want it working NOW?** → Run backend locally, use ngrok for testing
2. **Want proper production setup?** → Deploy backend separately (Option 1)
3. **Want single deployment?** → Fix monorepo config (Option 2)

**I recommend Option 1** - it's the cleanest and most maintainable solution.

---

## 🚀 **Quick Commands**

```bash
# Deploy backend separately
cd backend && vercel --prod

# Deploy frontend
vercel --prod

# Test backend (replace URL)
curl https://your-backend.vercel.app/api/health

# Temporary ngrok solution
ngrok http 3001
```

---

**Need help with any of these options?** Let me know which path you want to take!
