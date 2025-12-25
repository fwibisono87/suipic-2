import { fetchWithAuth } from '$lib/services/auth';
import type { TAlbum } from '$lib/types';

export type TCreateAlbumDTO = {
    title: string;
    description?: string;
};

export type TUpdateAlbumDTO = Partial<TCreateAlbumDTO>;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const albumService = {
    async getAlbums(): Promise<TAlbum[]> {
        const response = await fetchWithAuth(`${API_URL}/api/photographer/albums`);
        if (!response.ok) {
            throw new Error('Failed to fetch albums');
        }
        return response.json();
    },

    async getAlbum(id: string): Promise<TAlbum> {
        const response = await fetchWithAuth(`${API_URL}/api/photographer/albums/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch album');
        }
        return response.json();
    },

    async createAlbum(data: TCreateAlbumDTO): Promise<TAlbum> {
        const response = await fetchWithAuth(`${API_URL}/api/photographer/albums`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
             const error = await response.text();
            throw new Error(`Failed to create album: ${error}`);
        }
        return response.json();
    },

    async updateAlbum(id: string, data: TUpdateAlbumDTO): Promise<TAlbum> {
        const response = await fetchWithAuth(`${API_URL}/api/photographer/albums/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Failed to update album');
        return response.json();
    },

    async deleteAlbum(id: string): Promise<{ success: boolean }> {
        const response = await fetchWithAuth(`${API_URL}/api/photographer/albums/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete album');
        return response.json();
    }
};
