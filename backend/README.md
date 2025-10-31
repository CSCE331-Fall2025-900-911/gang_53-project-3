# Backend (Optional/Legacy)

⚠️ **Note**: The backend has been migrated to **Next.js API routes** in the `frontend/app/api` directory for Vercel serverless deployment.

This Express backend is maintained as an optional alternative for:
- Local testing and development
- Alternative deployment platforms (Render, Railway, Heroku)
- Complex backend logic requiring persistent connections
- Learning Express.js patterns

## Current Architecture

The main application now uses **Next.js API Routes** (serverless functions) which are:
- Located in: `frontend/app/api/`
- Deployed automatically with Vercel
- No separate server required

## When to Use This Express Backend

Use this backend if you:
- Need persistent WebSocket connections
- Require background jobs or cron tasks
- Want to deploy to platforms other than Vercel
- Need database connection pooling
- Prefer traditional server architecture

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/health` - Health check endpoint
- `GET /api/example` - Example API endpoint

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

## Project Structure

```
backend/
├── src/
│   └── server.ts       # Main server file
├── dist/               # Compiled JavaScript (generated)
├── .env                # Environment variables
├── .env.example        # Environment variables template
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── nodemon.json        # Nodemon configuration
```

## Migration to Next.js API Routes

The backend functionality has been converted to Next.js API routes:

```
frontend/app/api/
├── route.ts          # GET /api (root)
├── health/route.ts   # GET /api/health
└── example/route.ts  # GET /api/example
```

These serverless functions deploy automatically with your Next.js frontend on Vercel.

### Benefits of Serverless API Routes

✅ No separate backend server to manage  
✅ Automatic scaling  
✅ Lower hosting costs  
✅ Simplified deployment  
✅ Built-in TypeScript support  
✅ Same codebase as frontend  

## Deployment Options for Express Backend

If you choose to use this Express backend separately:

### Render
1. Connect your GitHub repo
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Deploy

### Railway
1. Connect your GitHub repo
2. Railway auto-detects Node.js
3. Set start command: `npm start`
4. Deploy

### Heroku
```bash
heroku create
git push heroku main
```
