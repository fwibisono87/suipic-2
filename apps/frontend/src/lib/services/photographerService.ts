import { fetchWithAuth } from '$lib/services/auth';
import type { TPhotographer } from '$lib/types';

export type TCreatePhotographerDTO = {
    keycloakId: string;
    email: string;
    displayName?: string;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const photographerService = {
    async getPhotographers(): Promise<TPhotographer[]> {
        const response = await fetchWithAuth(`${API_URL}/api/admin/photographers`);
        if (!response.ok) {
            throw new Error('Failed to fetch photographers');
        }
        return response.json();
    },

    async createPhotographer(data: TCreatePhotographerDTO): Promise<TPhotographer> {
        const response = await fetchWithAuth(`${API_URL}/api/admin/photographers`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to create photographer: ${error}`);
        }

        return response.json();
    }
};
