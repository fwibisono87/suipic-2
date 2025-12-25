import {createQuery} from '@tanstack/svelte-query';
import {fetchCurrentUser} from '../services/auth';
import type {TUser} from '../types';

export function useUser() {
    const userQuery = createQuery<TUser, Error>(() => ({
        queryKey: ['user', 'me'],
        queryFn: fetchCurrentUser,
        staleTime: Infinity 
    }));

    return {
        userQuery
    };
}
