import { createQuery } from '@tanstack/svelte-query';
import { clientService } from '../services/clientService';

export function useClients() {
    const clientsQuery = createQuery(() => ({
        queryKey: ['clients'],
        queryFn: () => clientService.getClients()
    }));

    return {
        clientsQuery
    };
}
