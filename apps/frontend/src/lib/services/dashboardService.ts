import { fetchWithAuth } from './auth';

export type TPhotographerStats = {
    totalAlbums: number;
    totalClients: number;
    totalPicks: number;
    avgRating: number;
};

export type TActivityItem = {
    type: 'comment' | 'feedback';
    date: string;
    data: any;
    imageFilename?: string; // For feedback context
};

export const dashboardService = {
    async getStats(): Promise<TPhotographerStats> {
        const res = await fetchWithAuth('/api/photographer/dashboard/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
    },

    async getActivity(): Promise<TActivityItem[]> {
        const res = await fetchWithAuth('/api/photographer/dashboard/activity');
        if (!res.ok) throw new Error('Failed to fetch activity');
        return res.json();
    }
};
