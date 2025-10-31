# Backend API

Express.js backend with TypeScript for gang_53-project-3.

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
