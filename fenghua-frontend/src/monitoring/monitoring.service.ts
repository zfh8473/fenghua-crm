/**
 * Monitoring Service
 * 
 * API client for system health monitoring
 * All custom code is proprietary and not open source.
 */

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:3001';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  database: {
    status: 'connected' | 'disconnected';
    latency?: number;
  };
  redis?: {
    status: 'connected' | 'disconnected';
    latency?: number;
  };
  service: {
    status: 'running' | 'stopped';
    uptime: number;
  };
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  timestamp: string;
}

export async function getHealthStatus(token: string): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch health status: ${response.statusText}`);
  }

  return response.json();
}

