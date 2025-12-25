import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { imageService } from '../services/imageService';
import type { TImage, TUserRole } from '../types';

// Simple role detection or explicit passing. 
// For now we'll require explicitly passing 'client' if needed, default to photographer.
// In a real app we might grab this from auth store state.

export function useImages(albumId: string | (() => string), role: TUserRole = 'photographer') {
    const client = useQueryClient();
    const getAlbumId = () => typeof albumId === 'function' ? albumId() : albumId;

    const imagesQuery = createQuery(() => ({
        queryKey: ['images', getAlbumId(), role],
        queryFn: () => {
            const id = getAlbumId();
            return id ? imageService.getImages(id, role) : Promise.resolve([]);
        },
        enabled: !!getAlbumId()
    }));

    const uploadMutation = createMutation(() => ({
        mutationFn: (file: File) => {
            const id = getAlbumId();
            if (!id) throw new Error('No album ID');
            return imageService.uploadImage(id, file);
        },
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ['images', getAlbumId()] });
        }
    }));

    return {
        imagesQuery,
        uploadMutation
    };
}
