import { createQuery } from '@tanstack/svelte-query';
import { dashboardService } from '../services/dashboardService';
import type { TPhotographerStats, TActivityItem } from '../services/dashboardService';

export function useDashboard() {
    const statsQuery = createQuery<TPhotographerStats>(() => ({
        queryKey: ['dashboard', 'stats'],
        queryFn: async () => dashboardService.getStats()
    }));

    const activityQuery = createQuery<TActivityItem[]>(() => ({
        queryKey: ['dashboard', 'activity'],
        queryFn: async () => dashboardService.getActivity()
    }));

    const metrics = $derived({
        totalAlbums: statsQuery.data?.totalAlbums ?? 0,
        totalClients: statsQuery.data?.totalClients ?? 0,
        totalPicks: statsQuery.data?.totalPicks ?? 0,
        avgRating: statsQuery.data?.avgRating ?? 0,
        storageUsed: '0.5 GB', 
        storageLimit: '10 GB'
    });

    return {
        statsQuery,
        activityQuery,
        metrics
    };
}
