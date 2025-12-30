import { FamilyMember, Plant, Chore } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
console.log(API_BASE_URL)

interface DashboardResponse {
  duePlants: Plant[];
  dueChores: Chore[];
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const apiService = {
  async getFamilyMembers(): Promise<FamilyMember[]> {
    const data = await fetchApi<FamilyMember[]>('/persons', {
      cache: 'no-store',
    });

    return data;
  },

  async getDashboardData(personId: number): Promise<{ plants: Plant[]; chores: Chore[] }> {
    const data = await fetchApi<DashboardResponse>(`/dashboard/${personId}`, {
      cache: 'no-store',
    });

    return {
      plants: data.duePlants,
      chores: data.dueChores
    };
  },

  async waterPlant(plantId: number): Promise<void> {
    await fetchApi(`/plant/${plantId}/water`, {
      method: 'PATCH'
    });
  },

  async completeChore(choreId: number): Promise<void> {
    await fetchApi(`/chore/${choreId}/done`, {
      method: 'PATCH'
    });
  },
};