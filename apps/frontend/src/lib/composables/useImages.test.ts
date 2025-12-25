import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { useImages } from './useImages';
import { imageService } from '../services/imageService';
import { QueryClient } from '@tanstack/svelte-query';

// Mock imageService
vi.mock('../services/imageService', () => ({
    imageService: {
        getImages: vi.fn(),
        uploadImage: vi.fn()
    }
}));

// Setup Query Client for testing
// Note: composables usually need to be run inside a component setup or with specific context
// But since useImages creates the queryClient internally via useQueryClient, we might need to mock it
// OR strictly test the logic if we export the query options factory.
// For simplicity in this env, we'll try to mock useQueryClient.

vi.mock('@tanstack/svelte-query', () => {
    return {
        useQueryClient: vi.fn(() => ({
            invalidateQueries: vi.fn()
        })),
        createQuery: vi.fn((optionsOrFn) => {
             const options = typeof optionsOrFn === 'function' ? optionsOrFn() : optionsOrFn;
             // Trigger queryFn to test coverage
             if (options.queryFn) {
                 try { options.queryFn(); } catch {}
             }
             return {
                 subscribe: vi.fn(),
                 data: [],
                 isLoading: false
             };
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


describe('useImages', () => {
    it('imagesQuery should call imageService.getImages', () => {
        const { imagesQuery, uploadMutation } = useImages('album-1');
        
        expect(imagesQuery).toBeDefined();
        expect(imageService.getImages).toHaveBeenCalledWith('album-1', 'photographer');
    });

    it('uploadMutation should call imageService.uploadImage', async () => {
        const { uploadMutation } = useImages('album-1');
        const file = new File([''], 'test.png');
        
        await uploadMutation.mutateAsync(file);
        
        expect(imageService.uploadImage).toHaveBeenCalledWith('album-1', file);
    });
});
