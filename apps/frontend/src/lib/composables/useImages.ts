import { createInfiniteQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { imageService } from '../services/imageService';
import { EUserRole, type TImage } from '../types';

export function useImages(albumId: string | (() => string), role: EUserRole = EUserRole.PHOTOGRAPHER) {
    const client = useQueryClient();
    const getAlbumId = () => typeof albumId === 'function' ? albumId() : albumId;

    const imagesQuery = createInfiniteQuery(() => ({
        queryKey: ['images', getAlbumId(), role],
        queryFn: async ({ pageParam = 0 }) => {
            const id = getAlbumId();
            if (!id) return [];
            return imageService.getImages(id, role, 50, pageParam as number);
        },
        getNextPageParam: (lastPage: TImage[], allPages) => {
            return lastPage.length === 50 ? allPages.length * 50 : undefined;
        },
        enabled: !!getAlbumId(),
        initialPageParam: 0
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
