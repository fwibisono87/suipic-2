import { fetchWithAuth } from '$lib/services/auth';
import type { TComment } from '$lib/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const commentService = {
    async createComment(data: { imageId: string; body: string; parentCommentId?: string }): Promise<TComment> {
        const response = await fetchWithAuth(`${API_URL}/api/comments`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Failed to post comment');
        return response.json();
    },

    async getCommentsForImage(imageId: string): Promise<TComment[]> {
        const response = await fetchWithAuth(`${API_URL}/api/comments/images/${imageId}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        return response.json();
    },

    async deleteComment(commentId: string): Promise<{ success: boolean }> {
        const response = await fetchWithAuth(`${API_URL}/api/comments/${commentId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete comment');
        return response.json();
    }
};
