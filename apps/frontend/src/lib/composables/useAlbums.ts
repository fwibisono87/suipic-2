import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { albumService, type TCreateAlbumDTO, type TUpdateAlbumDTO } from '../services/albumService';

export function useAlbums() {
    const queryClient = useQueryClient();

    const albumsQuery = createQuery(() => ({
        queryKey: ['albums'],
        queryFn: () => albumService.getAlbums()
    }));

    const createAlbumMutation = createMutation(() => ({
        mutationFn: (data: TCreateAlbumDTO) => albumService.createAlbum(data),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['albums'] });
        }
    }));

    const updateAlbumMutation = createMutation(() => ({
        mutationFn: ({ id, data }: { id: string; data: TUpdateAlbumDTO }) => albumService.updateAlbum(id, data),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['albums'] });
        }
    }));
    
    const deleteAlbumMutation = createMutation(() => ({
        mutationFn: (id: string) => albumService.deleteAlbum(id),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['albums'] });
        }
    }));

    return {
        albumsQuery,
        createAlbumMutation,
        updateAlbumMutation,
        deleteAlbumMutation
    };
}
