# gang_53-project-3

Full-stack web application with React, Next.js, TypeScript, and Tailwind CSS with serverless API routes.

## Tech Stack

### Frontend
- **React 19** - UI library
- **Next.js 16** - React framework with API routes
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling

### Backend
- **Next.js API Routes** - Serverless functions (deployed on Vercel)
- **Express** (Optional) - Available for local testing or alternative deployment

## Project Structure

```
gang_53-project-3/
├── frontend/              # Next.js frontend + API routes
│   ├── app/
│   │   ├── api/          # Serverless API routes
│   │   │   ├── route.ts           # GET /api
│   │   │   ├── health/route.ts    # GET /api/health
│   │   │   └── example/route.ts   # GET /api/example
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/       # React components
│   ├── lib/             # Utilities and API client
│   ├── public/          # Static assets
│   ├── vercel.json      # Vercel configuration
│   └── package.json
├── backend/             # Express backend (optional/legacy)
│   ├── src/
│   │   └── server.ts
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 20+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd gang_53-project-3
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

3. **Configure Environment Variables (Optional)**

Frontend: Copy `.env.example` to `.env.local` if you need custom configuration:
```bash
cd frontend
cp .env.example .env.local
```

### Running the Application

#### Development Mode (Recommended)

Start the Next.js development server (includes both frontend and API):
```bash
cd frontend
npm run dev
```

The app will run on http://localhost:3000

**API Endpoints available:**
- http://localhost:3000/api
- http://localhost:3000/api/health
- http://localhost:3000/api/example

#### Alternative: Standalone Express Backend (Optional)

If you need to run the Express backend separately:

1. **Install Backend Dependencies**
```bash
cd backend
npm install
cp .env.example .env
```

2. **Start Backend and Frontend Separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Runs on http://localhost:5000

# Terminal 2 - Frontend  
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## Deployment

### Vercel (Recommended)

This project is optimized for Vercel deployment with serverless API routes.

1. **Push your code to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push
```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set **Root Directory** to `frontend`
   - Deploy!

3. **Your API will be automatically available at:**
   - `https://your-domain.vercel.app/api`
   - `https://your-domain.vercel.app/api/health`
   - `https://your-domain.vercel.app/api/example`

### Alternative Deployment Options

**Express Backend (Optional):**
- **Render** - Free tier available
- **Railway** - Free tier available  
- **Heroku** - Paid hosting
- **DigitalOcean** - App Platform

## Team Setup Instructions

When your team clones this repository, they need to:

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Start development server**
```bash
npm run dev
```

3. **Access the app**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

That's it! No additional setup required.

## Available Scripts

### Frontend
- `npm run dev` - Start development server (frontend + API)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Backend (Optional/Legacy)
- `npm run dev` - Start Express development server
- `npm run build` - Compile TypeScript
- `npm start` - Start Express production server
- `npm run lint` - Run ESLint

## API Endpoints

All API routes are serverless functions in `frontend/app/api/`:

- `GET /api` - Root endpoint with status
- `GET /api/health` - Health check with uptime
- `GET /api/example` - Example endpoint with sample data

## Development

### Adding New API Routes

Create new route files in `frontend/app/api/`:

```typescript
// frontend/app/api/your-route/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Your data here'
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true });
}
```

### Frontend Development

The frontend uses Next.js App Router. Create pages in the `frontend/app/` directory.

## Architecture

This project uses **Next.js API Routes** (serverless functions) instead of a traditional Express server:

- ✅ **No separate backend server needed**
- ✅ **Automatic deployment to Vercel**
- ✅ **Scales automatically**
- ✅ **Built-in TypeScript support**

The Express backend is maintained as an optional alternative for:
- Local testing and development
- Alternative deployment platforms
- Complex backend logic requiring persistent connections

## License

[Add your license here]
