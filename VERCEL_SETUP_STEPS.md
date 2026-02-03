# 🚀 Vercel Backend Setup - Quick Guide

## ✅ Code Pushed to GitHub

Your latest changes are now on GitHub:
- Commit: `10f8e72`
- Repository: `sunnysolana2003-crypto/ShadowFund`

## 🎯 Next: Configure Vercel for Backend

Your Vercel project `shadow-fund-oxo2` needs to be configured to deploy the backend.

### **Option 1: Create Separate Backend Project** (RECOMMENDED)

#### Step 1: Deploy Backend to Vercel

```bash
cd backend
vercel --prod
```

**Follow the prompts:**
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- What's your project's name? **shadowfund-backend**
- In which directory is your code located? **./** (current directory)
- Want to override settings? **No**

This creates a **NEW** Vercel project just for the backend.

#### Step 2: Add Environment Variables to Backend Project

Go to: https://vercel.com/your-username/shadowfund-backend/settings/environment-variables

Add these:
```
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SHADOWWIRE_CLUSTER=mainnet-beta
TESTING_MODE=true
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key
```

⚠️ **Don't add `SERVER_WALLET_SECRET`** for now (security - we'll use demo mode)

#### Step 3: Redeploy Backend

```bash
vercel --prod
```

Your backend will be at: `https://shadowfund-backend.vercel.app`

#### Step 4: Update Frontend to Use New Backend

In your root `.env.local`:
```env
VITE_API_URL=https://shadowfund-backend.vercel.app
```

Then rebuild and redeploy frontend:
```bash
npm run build
vercel --prod
```

---

### **Option 2: Use Vercel Dashboard** (Easier)

#### Step 1: Create New Project for Backend

1. Go to https://vercel.com/new
2. Import from: **sunnysolana2003-crypto/ShadowFund**
3. **Root Directory**: Set to `backend`
4. **Framework Preset**: Next.js
5. **Project Name**: `shadowfund-backend`
6. Click **Deploy**

#### Step 2: Add Environment Variables

In the deployment settings, add all the env vars listed above.

#### Step 3: Update Frontend Project

1. Go to your existing `shadow-fund-oxo2` project settings
2. Environment Variables → Add:
   ```
   VITE_API_URL=https://shadowfund-backend.vercel.app
   ```
3. Redeploy frontend

---

## 🧪 Test Backend After Deployment

Once deployed, test these endpoints:

```bash
# Health check
curl https://shadowfund-backend.vercel.app/api/health

# Should return:
# {"status":"ok","timestamp":"...","network":"mainnet","version":"1.0.0"}

# Treasury check (replace with your wallet)
curl "https://shadowfund-backend.vercel.app/api/treasury?wallet=YOUR_WALLET&risk=medium"

# Debug balance
curl "https://shadowfund-backend.vercel.app/api/debug-balance?wallet=YOUR_WALLET"
```

If all return JSON (not 404), it's working! ✅

---

## 📋 Deployment Checklist

- [ ] Code pushed to GitHub ✅
- [ ] Create `shadowfund-backend` project on Vercel
- [ ] Set environment variables in backend project
- [ ] Deploy backend successfully
- [ ] Test backend API endpoints
- [ ] Update frontend `VITE_API_URL`
- [ ] Redeploy frontend
- [ ] Test full app with wallet connection

---

## ⚡ Quick Commands

```bash
# Backend deployment
cd backend
vercel --prod

# Frontend update
cd ..
echo "VITE_API_URL=https://shadowfund-backend.vercel.app" > .env.local
npm run build
vercel --prod

# Test backend
curl https://shadowfund-backend.vercel.app/api/health
```

---

## 🔍 Troubleshooting

### Backend Returns 500 Errors
**Issue**: Missing environment variables  
**Fix**: Add all required env vars in Vercel dashboard

### Frontend Still Gets 404
**Issue**: Frontend still using old URL  
**Fix**: 
1. Update `.env.local` with new backend URL
2. Rebuild: `npm run build`
3. Redeploy: `vercel --prod`

### CORS Errors
**Issue**: Backend not allowing frontend domain  
**Fix**: Backend CORS is already configured in `backend/lib/cors.ts` - should work automatically

---

## 🎯 What You Should See

**Before** (Current - Broken):
```
Frontend: https://shadow-fund-oxo2.vercel.app ✅
Backend: https://shadow-fund-oxo2.vercel.app/api/* ❌ (404)
```

**After** (Working):
```
Frontend: https://shadow-fund-oxo2.vercel.app ✅
Backend: https://shadowfund-backend.vercel.app ✅
Frontend calls Backend API ✅
```

---

## 📞 Need Help?

If deployment fails:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Test backend endpoints manually
4. Check GitHub repo has latest code

---

**Ready to deploy?** Run:
```bash
cd backend && vercel --prod
```

Then follow the steps above! 🚀
