import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Welcome to the API',
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
}
