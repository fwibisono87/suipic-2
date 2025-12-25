import { describe, it, expect, vi } from 'vitest';
import { useAlbums } from './useAlbums';
import { albumService } from '../services/albumService';

// Mock TanStack Query
vi.mock('@tanstack/svelte-query', () => {
    return {
        useQueryClient: vi.fn(() => ({
            invalidateQueries: vi.fn()
        })),
        createQuery: vi.fn((optionsOrFn) => {
             const options = typeof optionsOrFn === 'function' ? optionsOrFn() : optionsOrFn;
             if (options.queryFn) { try { options.queryFn(); } catch {} }
             return { subscribe: vi.fn(), data: [], isLoading: false };
        }),
        createMutation: vi.fn((optionsOrFn) => {
             const options = typeof optionsOrFn === 'function' ? optionsOrFn() : optionsOrFn;
            return {
                mutateAsync: async (vars: any) => {
                    if (options.mutationFn) await options.mutationFn(vars);
                    if (options.onSuccess) options.onSuccess();
                },
                isPending: false
            };
        })
    };
});

// Mock Service
vi.mock('../services/albumService', () => ({
    albumService: {
        getAlbums: vi.fn(),
        createAlbum: vi.fn(),
        updateAlbum: vi.fn(),
        deleteAlbum: vi.fn()
    }
}));

describe('useAlbums', () => {
    it('albumsQuery should call albumService.getAlbums', () => {
        const { albumsQuery } = useAlbums();
        expect(albumsQuery).toBeDefined();
        expect(albumService.getAlbums).toHaveBeenCalled();
    });

    it('createAlbumMutation should call albumService.createAlbum', async () => {
        const { createAlbumMutation } = useAlbums();
        const data = { title: 'Test Album' };
        await createAlbumMutation.mutateAsync(data);
        expect(albumService.createAlbum).toHaveBeenCalledWith(data);
    });

    it('updateAlbumMutation should call albumService.updateAlbum', async () => {
        const { updateAlbumMutation } = useAlbums();
        const data = { title: 'Updated Album' };
        await updateAlbumMutation.mutateAsync({ id: '1', data });
        expect(albumService.updateAlbum).toHaveBeenCalledWith('1', data);
    });

    it('deleteAlbumMutation should call albumService.deleteAlbum', async () => {
        const { deleteAlbumMutation } = useAlbums();
        await deleteAlbumMutation.mutateAsync('1');
        expect(albumService.deleteAlbum).toHaveBeenCalledWith('1');
    });
});
