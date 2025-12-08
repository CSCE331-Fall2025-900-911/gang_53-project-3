import { NextResponse } from 'next/server';

const pickBackendUrl = (req: Request) => {
  const host = req.headers.get('host') || '';
  const isLocalHost =
    host.includes('localhost') ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('100.64.');

  // In local dev, force localhost backend even if NEXT_PUBLIC_API_URL points to prod
  if (process.env.NODE_ENV !== 'production' && isLocalHost) {
    return (process.env.NEXT_PUBLIC_LOCAL_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  }

  // Default to configured backend (production / remote)
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const backendUrl = pickBackendUrl(req);
    const response = await fetch(`${backendUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to create order' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Order API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process order' },
      { status: 500 }
    );
  }
}
