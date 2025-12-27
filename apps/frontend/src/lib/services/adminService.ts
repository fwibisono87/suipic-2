import { fetchWithAuth } from './auth';
import { EUserRole } from '../types';

export type TUserProfile = {
    id: string;
    email: string;
    displayName: string;
    role: EUserRole;
    isActive: boolean;
    createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const adminService = {
    async listAllUsers(): Promise<TUserProfile[]> {
        const response = await fetchWithAuth(`${API_URL}/api/admin/users`);
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    async setUserStatus(id: string, isActive: boolean): Promise<TUserProfile> {
        const response = await fetchWithAuth(`${API_URL}/api/admin/users/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to update user status');
        return response.json();
    }
};
