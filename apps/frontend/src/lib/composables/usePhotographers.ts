import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { photographerService, type TCreatePhotographerDTO } from '../services/photographerService';

// Ensure reactivity for query options by wrapping in a function
export function usePhotographers() {
    const queryClient = useQueryClient();

    const photographersQuery = createQuery(() => ({
        queryKey: ['photographers'],
        queryFn: () => photographerService.getPhotographers()
    }));

    const createPhotographerMutation = createMutation(() => ({
        mutationFn: (data: TCreatePhotographerDTO) => photographerService.createPhotographer(data),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['photographers'] });
        }
    }));

    return {
        photographersQuery,
        createPhotographerMutation
    };
}
