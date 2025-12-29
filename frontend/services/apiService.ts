import { FamilyMember, Plant, Chore } from '../lib/types';

const API_BASE_URL = 'http://127.0.0.1:8000';

interface DashboardResponse {
  duePlants: [number, string, number, number, string | undefined, number][];
  dueChores: [number, string, number, number, number][];
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
  // Familie laden
  async getFamilyMembers(): Promise<FamilyMember[]> {
    const data = await fetchApi<[number, string, string][]>('/persons', {
      cache: 'no-store',
    });

    return data.map(([id, name, role]) => ({ id, name, role }));
  },

  // Dashboard-Daten für bestimmte Person laden
  async getDashboardData(personId: number): Promise<{ plants: Plant[]; chores: Chore[] }> {
    const data = await fetchApi<DashboardResponse>(`/dashboard/${personId}`, {
      cache: 'no-store',
    });

    const plants: Plant[] = data.duePlants.map(
      ([id, name, interval, last_pour, image, owner_id]) => ({
        id,
        name,
        interval,
        last_pour,
        image,
        owner_id,
      })
    );

    const chores: Chore[] = data.dueChores.map(
      ([id, name, interval, last_done, worker_id]) => ({
        id,
        name,
        interval,
        last_done,
        worker_id,
      })
    );

    return { plants, chores };
  },

  // Pflanze gießen
  async waterPlant(plantId: number): Promise<void> {
    await fetchApi(`/plant/${plantId}/water`, {
      method: 'PATCH'
    });
  },

  // Aufgabe als erledigt markieren
  async completeChore(choreId: number): Promise<void> {
    await fetchApi(`/chore/${choreId}/done`, {
      method: 'PATCH'
    });
  },
};