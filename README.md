# gang_53-project-3

Full-stack web application with React, Next.js, Express, TypeScript, and Tailwind CSS.

## Tech Stack

### Frontend
- **React 19** - UI library
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **CORS** - Cross-origin support

## Project Structure

```
gang_53-project-3/
├── frontend/          # Next.js frontend application
│   ├── app/          # Next.js app directory
│   ├── public/       # Static assets
│   └── package.json
├── backend/          # Express backend API
│   ├── src/         # TypeScript source files
│   ├── dist/        # Compiled JavaScript (generated)
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

3. **Install Backend Dependencies**
```bash
cd ../backend
npm install
```

4. **Configure Environment Variables**

Backend: Copy `.env.example` to `.env` and adjust as needed:
```bash
cd backend
cp .env.example .env
```

### Running the Application

#### Development Mode

1. **Start the Backend Server** (in one terminal)
```bash
cd backend
npm run dev
```
The API will run on http://localhost:5000

2. **Start the Frontend** (in another terminal)
```bash
cd frontend
npm run dev
```
The app will run on http://localhost:3000

#### Production Mode

1. **Build the Backend**
```bash
cd backend
npm run build
npm start
```

2. **Build the Frontend**
```bash
cd frontend
npm run build
npm start
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `GET /api/example` - Example endpoint

## Development

### Adding New API Routes

Create new route files in `backend/src/` and import them in `server.ts`.

### Frontend Development

The frontend uses Next.js App Router. Create pages in the `frontend/app/` directory.

## License

[Add your license here]
