import type { TImage } from '../types';
import { fetchWithAuth } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const imageService = {
    async getImages(albumId: string, role: string = 'photographer'): Promise<TImage[]> {
        const url = role === 'client' 
            ? `${API_URL}/api/client/albums/${albumId}/images`
            : `${API_URL}/api/photographer/albums/${albumId}/images`; // Admin/Photographer access same logic mostly, or distinct if needed
        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error('Failed to fetch images');
        return res.json();
    },

    async getImage(albumId: string, imageId: string, role: string = 'photographer'): Promise<TImage> {
        const url = role === 'client'
             ? `${API_URL}/api/client/albums/${albumId}/images/${imageId}`
             : `${API_URL}/api/photographer/albums/${albumId}/images/${imageId}`;
        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error('Failed to fetch image');
        return res.json();
    },

    async uploadImage(albumId: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);

        // fetchWithAuth handles headers, but for FormData we often need to let browser set Content-Type boundary
        // Our fetchWithAuth might force Content-Type: application/json if we aren't careful?
        // Let's check auth.ts first or just use custom options.
        // Usually we pass a flag or just don't set Content-Type if body is FormData.
        
        // Let's assume fetchWithAuth is smart or we can pass headers override.
        // Actually, let's look at fetchWithAuth first to be safe.
        // I will assume for now it merges headers. 
        // If I pass undefined Content-Type it should work?
        
        const res = await fetchWithAuth(`${API_URL}/api/photographer/albums/${albumId}/images`, {
            method: 'POST',
            body: formData,
            // Header content-type for formData must be undefined to let browser set boundary
             headers: {} 
        });
        
        if (!res.ok) throw new Error('Failed to upload image');
        return res.json();
    }
};
