import { describe, it, expect, vi } from 'vitest';
import { usePhotographers } from './usePhotographers';
import { photographerService } from '../services/photographerService';

// Mock TanStack Query
vi.mock('@tanstack/svelte-query', () => {
    return {
        useQueryClient: vi.fn(() => ({
            invalidateQueries: vi.fn()
        })),
        createQuery: vi.fn((optionsOrFn) => {
             const options = typeof optionsOrFn === 'function' ? optionsOrFn() : optionsOrFn;
             // Trigger queryFn for coverage
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

// Mock Service
vi.mock('../services/photographerService', () => ({
    photographerService: {
        getPhotographers: vi.fn(),
        createPhotographer: vi.fn()
    }
}));

describe('usePhotographers', () => {
    it('photographersQuery should call photographerService.getPhotographers', () => {
        const { photographersQuery } = usePhotographers();
        expect(photographersQuery).toBeDefined();
        // The mock implementation of createQuery runs logic that calls getPhotographers,
        // so we check if the service method was accessed/called.
        expect(photographerService.getPhotographers).toHaveBeenCalled();
    });

    it('createPhotographerMutation should call photographerService.createPhotographer', async () => {
        const { createPhotographerMutation } = usePhotographers();
        const data = { keycloakId: '123', email: 'test@example.com' };
        
        await createPhotographerMutation.mutateAsync(data);
        
        expect(photographerService.createPhotographer).toHaveBeenCalledWith(data);
    });
});
