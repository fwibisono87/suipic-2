import { fetchWithAuth } from '$lib/services/auth';

export type TClientProfile = {
    id: string;
    keycloakId: string;
    email: string;
    displayName: string;
    role: 'client';
    photographerId: string;
    createdAt: string;
    updatedAt: string;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const clientService = {
    async getClients(): Promise<TClientProfile[]> {
        const response = await fetchWithAuth(`${API_URL}/api/photographer/clients`);
        if (!response.ok) {
            throw new Error('Failed to fetch clients');
        }
        return response.json();
    }
};
