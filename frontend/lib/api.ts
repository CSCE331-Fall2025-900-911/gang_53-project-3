// API utility for making calls to Next.js API routes

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// API response types
export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
}

export interface ExampleResponse {
  message: string;
  data: any;
}

export interface RootResponse {
  message: string;
  status: string;
  timestamp: string;
}

// Example API functions
export const api = {
  // Root endpoint
  root: () => fetchAPI<RootResponse>(''),
  
  // Health check
  health: () => fetchAPI<HealthResponse>('/health'),
  
  // Example endpoint
  getExample: () => fetchAPI<ExampleResponse>('/example'),
  
  // Add more API functions as needed
};

export async function fetchUsers() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
    cache: 'no-store', // ensures always fresh data
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch users: ${res.statusText}`);
  }

  return res.json();
}
