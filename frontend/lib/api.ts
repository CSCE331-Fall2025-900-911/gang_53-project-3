// Example utility for making API calls to the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

// Example API functions
export const api = {
  // Health check
  health: () => fetchAPI<{ status: string; uptime: number; timestamp: string }>('/api/health'),
  
  // Example endpoint
  getExample: () => fetchAPI<{ message: string; data: any }>('/api/example'),
  
  // Add more API functions as needed
};
