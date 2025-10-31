# Vercel Deployment Guide

## ✅ Your Backend is Now Vercel-Ready!

Your Express backend has been converted to **Next.js API Routes** (serverless functions) that work perfectly with Vercel.

## What Changed

### Before (Express Backend)
```
Separate Express server on port 5000
Frontend calls: http://localhost:5000/api/health
Requires two servers running
```

### After (Next.js API Routes)
```
API routes integrated into Next.js
Frontend calls: http://localhost:3000/api/health (or just /api/health)
Single server for everything
```

## New API Route Structure

```
frontend/app/api/
├── route.ts           → GET /api
├── health/route.ts    → GET /api/health  
└── example/route.ts   → GET /api/example
```

## Local Development

**Single command runs everything:**
```bash
cd frontend
npm run dev
```

Access:
- Frontend: http://localhost:3000
- API Root: http://localhost:3000/api
- Health: http://localhost:3000/api/health
- Example: http://localhost:3000/api/example

## Deploying to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Migrate to Vercel serverless functions"
git push
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. **Important**: Set **Root Directory** to `frontend`
5. Click "Deploy"

### Step 3: Done! 🎉

Your API will be live at:
- `https://your-app.vercel.app/api`
- `https://your-app.vercel.app/api/health`
- `https://your-app.vercel.app/api/example`

## Environment Variables (Optional)

If you need environment variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add your variables (e.g., database URLs, API keys)
3. Redeploy

## Team Setup

When teammates pull this code:

```bash
# 1. Pull latest code
git pull

# 2. Install dependencies (if needed)
cd frontend
npm install

# 3. Start dev server
npm run dev
```

That's it! No backend setup needed.

## Testing API Routes

### Test in Browser
- http://localhost:3000/api
- http://localhost:3000/api/health
- http://localhost:3000/api/example

### Test with curl
```bash
curl http://localhost:3000/api/health
```

### Test in Code
```typescript
import { api } from '@/lib/api';

// In your component
const health = await api.health();
console.log(health); // { status: 'healthy', uptime: 123, timestamp: '...' }
```

## Creating New API Routes

Create a new file in `frontend/app/api/[your-route]/route.ts`:

```typescript
import { NextResponse } from 'next/server';

// GET /api/your-route
export async function GET(request: Request) {
  return NextResponse.json({
    message: 'Hello from your new route!'
  });
}

// POST /api/your-route
export async function POST(request: Request) {
  const body = await request.json();
  
  // Process data
  
  return NextResponse.json({
    success: true,
    data: body
  });
}
```

## Express Backend (Optional)

The Express backend in the `backend/` folder is **optional** and maintained for:
- Local testing
- Alternative deployment (Render, Railway)
- Learning purposes

You don't need it for Vercel deployment!

## Benefits of This Setup

✅ **No separate backend server** - Everything runs on Next.js  
✅ **Automatic Vercel deployment** - Push to GitHub and deploy  
✅ **Serverless scaling** - Handles any traffic automatically  
✅ **Lower costs** - Pay only for what you use  
✅ **Simpler architecture** - One codebase, one deployment  
✅ **Built-in TypeScript** - Full type safety  

## Troubleshooting

### "Cannot GET /api/..."
- Make sure you're running `npm run dev` from the `frontend` folder
- Check that the route file exists in `frontend/app/api/[route]/route.ts`

### Vercel deployment fails
- Verify Root Directory is set to `frontend` in Vercel settings
- Check build logs for errors
- Ensure all dependencies are in `frontend/package.json`

### API returns 404 on Vercel but works locally
- Clear Vercel cache and redeploy
- Check that route files are committed to Git
- Verify file names are correct (lowercase `route.ts`)

## Next Steps

1. ✅ Test locally: http://localhost:3000/api/health
2. ✅ Commit and push your changes
3. ✅ Deploy to Vercel
4. ✅ Share the URL with your team!

Happy coding! 🚀
