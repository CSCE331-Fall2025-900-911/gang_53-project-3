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


3. **Your API will be automatically available at:**
   - `https://your-domain.vercel.app/api`
   - `https://your-domain.vercel.app/api/health`
   - `https://your-domain.vercel.app/api/example`


3. **Access the app**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api



### Frontend
- `npm run dev` - Start development server (frontend + API)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Backend 
- `npm run dev` - Start Express development server
- `npm run build` - Compile TypeScript
- `npm start` - Start Express production server
- `npm run lint` - Run ESLint


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

