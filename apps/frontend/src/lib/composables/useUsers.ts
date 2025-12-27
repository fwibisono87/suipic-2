import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { adminService } from '$lib/services/adminService';

export function useUsers() {
    const queryClient = useQueryClient();

    const usersQuery = createQuery(() => ({
        queryKey: ['admin', 'users'],
        queryFn: () => adminService.listAllUsers()
    }));

    const setUserStatusMutation = createMutation(() => ({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
            adminService.setUserStatus(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        }
    }));

    return {
        usersQuery,
        setUserStatusMutation
    };
}
