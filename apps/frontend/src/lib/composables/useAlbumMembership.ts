import { createMutation, useQueryClient, createQuery } from '@tanstack/svelte-query';
import { albumService } from '$lib/services/albumService';
import { photographerService } from '$lib/services/photographerService';
import { clientService } from '$lib/services/clientService';

export function useAlbumMembership(albumId: string) {
    const queryClient = useQueryClient();

    const addClientMutation = createMutation(() => ({
        mutationFn: (clientId: string) => albumService.addClient(albumId, clientId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['albums', albumId] });
        }
    }));

    const removeClientMutation = createMutation(() => ({
        mutationFn: (clientId: string) => albumService.removeClient(albumId, clientId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['albums', albumId] });
        }
    }));

    const addCollaboratorMutation = createMutation(() => ({
        mutationFn: (photographerId: string) => albumService.addCollaborator(albumId, photographerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['albums', albumId] });
        }
    }));

    const removeCollaboratorMutation = createMutation(() => ({
        mutationFn: (photographerId: string) => albumService.removeCollaborator(albumId, photographerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['albums', albumId] });
        }
    }));
    
    const photographersQuery = createQuery(() => ({
        queryKey: ['admin', 'photographers'],
        queryFn: () => photographerService.getPhotographers()
    }));
    
    const clientsQuery = createQuery(() => ({
        queryKey: ['photographer', 'clients'],
        queryFn: () => clientService.getClients()
    }));

    return {
        addClientMutation,
        removeClientMutation,
        addCollaboratorMutation,
        removeCollaboratorMutation,
        photographersQuery,
        clientsQuery
    };
}
